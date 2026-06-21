import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { isSupabaseConfigured } from "@/lib/supabase/env";

import { APP_NAME } from "@/lib/config";

import { NotificationBell } from "@/components/layout/NotificationBell";

export const revalidate = 30;

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar user={user} />
      <main className="md:ml-[var(--sidebar-width)] min-h-screen flex flex-col pb-16 md:pb-0">
        {/* Global Top Navbar */}
        <header className="flex h-14 md:h-16 items-center justify-between border-b border-gray-100 bg-white px-4 md:px-8 sticky top-0 z-30 shadow-sm">
          <div className="text-sm font-semibold text-gray-700">
            {user.group_id ? `${APP_NAME} Çalışma Alanı` : "Grup Oluşturun veya Davet Kabul Edin"}
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
