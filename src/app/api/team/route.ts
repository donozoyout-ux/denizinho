import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId") || user.group_id;

  if (!groupId) {
    return NextResponse.json([]);
  }

  const admin = createAdminClient();
  if (admin) {
    const { data: memberships, error: memError } = await admin
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (!memError && memberships && memberships.length > 0) {
      const userIds = memberships.map((m) => m.user_id);
      const { data, error } = await admin
        .from("users")
        .select("*")
        .in("id", userIds)
        .order("full_name");

      if (!error) return NextResponse.json(data ?? []);
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("group_id", groupId)
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, role, telegramChatId } = body as {
    userId: string;
    role?: UserRole;
    telegramChatId?: string | null;
  };

  if (!userId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (role !== undefined) {
    if (!["patron", "team_member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updateData.role = role;
  }
  if (telegramChatId !== undefined) {
    updateData.telegram_chat_id = telegramChatId ? telegramChatId.trim() : null;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const supabase = admin || (await createClient());

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
