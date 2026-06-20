import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { fetchUserGroups, getGroupMembers } from "@/lib/groups-server";
import { Header } from "@/components/layout/Header";
import { TeamManagement } from "@/components/team/TeamManagement";
import type { User } from "@/types/database";

export const revalidate = 30;
export const dynamic = "force-dynamic";

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
    members = await getGroupMembers(admin, user.group_id);
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
