import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">
            Supabase yapılandırılmamış
          </h2>
          <p className="mt-2 text-sm text-red-600">
            .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL ve
            NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini ayarlayın.
          </p>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Kullanıcının grubu yoksa group-setup sayfasına yönlendir
  // (group-setup sayfasının kendisi hariç – sonsuz döngü olmasın)
  const isGroupSetupPage =
    typeof globalThis !== "undefined" ? false : false; // layout'ta path bilgisi yok, aşağıdaki children kontrol edilecek

  if (!user.group_id) {
    // group-setup sayfası zaten açıksa sidebar olmadan göster
    return (
      <div className="min-h-screen bg-[var(--background)]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar user={user} />
      <main className="ml-[var(--sidebar-width)] min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}
