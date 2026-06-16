import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { TeamManagement } from "@/components/team/TeamManagement";
import type { User } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (user?.role !== "patron") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("users")
    .select("*")
    .or(`id.eq.${user.id},invited_by.eq.${user.id}`)
    .order("full_name");

  return (
    <div className="space-y-8">
      <Header
        title="Ekip Yönetimi"
        description="Üye ekleyin, rolleri yönetin ve yetkilendirmeleri düzenleyin"
      />
      <TeamManagement initialMembers={(members as User[]) ?? []} />
    </div>
  );
}
