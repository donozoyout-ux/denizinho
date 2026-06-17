"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Table2,
  Folder,
  Users,
  LogOut,
  Leaf,
  Settings,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isGroupAdmin } from "@/lib/auth-client";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";
import { RoleBadge } from "@/components/ui/Badge";

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
        { href: "/table", label: "Tablo Görünümü", icon: Table2 },
        { href: "/projects", label: "Projeler", icon: Folder },
        { href: "/team", label: "Ekip Yönetimi", icon: Users },
        { href: "/settings", label: "Profil & Ayarlar", icon: Settings },
      ]
    : [
        { href: "/group-setup", label: "Grup Oluştur", icon: PlusCircle },
        { href: "/settings", label: "Profil & Ayarlar", icon: Settings },
      ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tider-green">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">TIDER Görev</h1>
          <p className="text-xs text-gray-500">NGO Task Manager</p>
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-tider-green-light text-tider-green-dark"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-gray-900">
            {user.full_name || user.email}
          </p>
          <div className="mt-1">
            <RoleBadge isAdmin={isGroupAdmin(user)} />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
