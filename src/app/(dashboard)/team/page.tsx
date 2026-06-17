import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { TeamManagement } from "@/components/team/TeamManagement";
import type { User } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.group_id) {
    redirect("/group-setup");
  }

  const supabase = await createClient();

  // Aynı gruptaki tüm üyeleri getir (RLS group_id bazlı filtreleyecek)
  const { data: members } = await supabase
    .from("users")
    .select("*")
    .eq("group_id", user.group_id)
    .order("full_name");

  return (
    <div className="space-y-8">
      <Header
        title="Ekip Yönetimi"
        description="Üye davet edin ve ekip üyelerinizi yönetin"
      />
      <TeamManagement initialMembers={(members as User[]) ?? []} />
    </div>
  );
}
