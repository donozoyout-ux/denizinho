import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { fetchUserGroups } from "@/lib/groups-server";
import { Header } from "@/components/layout/Header";
import { TeamManagement } from "@/components/team/TeamManagement";
import type { User } from "@/types/database";

export const revalidate = 30;

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.group_id) {
    redirect("/group-setup");
  }

  const admin = createAdminClient();
  let groups: { id: string; name: string; owner_id: string; role: string }[] = [];
  let members: User[] = [];

  if (admin) {
    groups = await fetchUserGroups(admin, user.id, user.group_id);

    const activeGroupId = user.group_id;
    const { data: memberRows } = await admin
      .from("group_members")
      .select("user_id")
      .eq("group_id", activeGroupId);

    if (memberRows && memberRows.length > 0) {
      const ids = memberRows.map((r) => r.user_id);
      const { data } = await admin
        .from("users")
        .select("*")
        .in("id", ids)
        .order("full_name");
      members = (data as User[]) ?? [];
    } else {
      // Fallback: users.group_id ile üyeler
      const { data } = await admin
        .from("users")
        .select("*")
        .eq("group_id", activeGroupId)
        .order("full_name");
      members = (data as User[]) ?? [];
    }
  }

  return (
    <div className="space-y-8">
      <Header
        title="Ekip Yönetimi"
        description="Gruplarınızı yönetin, üye davet edin ve ekiplerinizi organize edin"
      />
      <TeamManagement
        initialMembers={members}
        initialGroups={groups}
        activeGroupId={user.group_id}
      />
    </div>
  );
}
