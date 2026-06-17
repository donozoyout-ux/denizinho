import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { User, UserRole } from "@/types/database";
import { isGroupAdmin } from "./auth-client";

function userFromAuth(authUser: {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
}): User {
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    full_name: (authUser.user_metadata?.full_name as string) ?? null,
    role: (authUser.user_metadata?.role as UserRole) ?? "team_member",
    created_at: authUser.created_at ?? new Date().toISOString(),
  };
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        return userFromAuth(user);
      }
      if (error.code === "PGRST116") {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();
        if (admin) {
          const newUser = {
            id: user.id,
            email: user.email || "",
            full_name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || null,
            role: (user.user_metadata?.role as UserRole) || "team_member",
          };
          const { data: inserted, error: insertError } = await admin
            .from("users")
            .insert(newUser)
            .select()
            .single();
          if (!insertError && inserted) {
            return inserted as User;
          } else {
            console.error("[auth] failed to auto-insert user to public.users:", insertError?.message);
          }
        }
        return userFromAuth(user);
      }
      console.error("[auth] getCurrentUser error:", error.message);
      return userFromAuth(user);
    }

    return data as User;
  } catch (err) {
    console.error("[auth] getCurrentUser failed:", err);
    return null;
  }
});

export { isGroupAdmin };

/** @deprecated isGroupAdmin kullanın */
export async function isPatron(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return isGroupAdmin(user);
}

export async function isDatabaseReady(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("users").select("id").limit(1);
    return !error || error.code !== "PGRST205";
  } catch {
    return false;
  }
}
