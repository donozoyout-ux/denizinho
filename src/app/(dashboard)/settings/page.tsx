import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <Header
        title="Profil & Ayarlar"
        description="Hesap bilgilerinizi güncelleyin ve Telegram bildirimlerinizi bağlayın"
      />
      <ProfileSettingsForm user={user} />
    </div>
  );
}
