"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Folder,
  Users,
  LogOut,
  Leaf,
  PlusCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isGroupAdmin } from "@/lib/auth-client";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { RoleBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { useState } from "react";

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = user.group_id
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/board", label: "Görev Panosu", icon: Kanban },
        { href: "/projects", label: "Projeler", icon: Folder },
        { href: "/team", label: "Ekip Yönetimi", icon: Users },
      ]
    : [{ href: "/group-setup", label: "Grup Oluştur", icon: PlusCircle }];

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col border-r border-gray-200 bg-gradient-to-b from-white to-slate-50">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-tider-green to-emerald-600 shadow-md shadow-green-200/50">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">{APP_NAME}</h1>
            <p className="text-xs text-gray-500">{APP_TAGLINE}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-tider-green-light to-emerald-50 text-tider-green-dark shadow-sm"
                    : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm hover:translate-x-0.5"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="mb-3 flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-sm border border-gray-100 transition-all hover:border-tider-green/30 hover:shadow-md group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-tider-green to-emerald-600 text-sm font-bold text-white">
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.full_name || user.email}
              </p>
              <div className="mt-0.5">
                <RoleBadge isAdmin={isGroupAdmin(user)} />
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-tider-green transition-colors" />
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Profili Yönet" size="sm">
        <ProfileSettingsForm user={user} />
      </Modal>
    </>
  );
}
