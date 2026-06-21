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
  BarChart3,
  HeartHandshake,
  Settings,
  HelpCircle,
  Plus,
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
        { href: "/board", label: "Tasks", icon: Kanban },
        { href: "/projects", label: "Projects", icon: Folder },
        { href: "/team", label: "Team", icon: Users },
        { href: "/donors", label: "Donors", icon: HeartHandshake },
        { href: "/reports", label: "Reports", icon: BarChart3 },
      ]
    : [{ href: "/group-setup", label: "Grup Oluştur", icon: PlusCircle }];

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-[var(--sidebar-width)] flex-col border-r border-slate-200/80 bg-[#f8fafc]">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 shadow-md shadow-emerald-950/20">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">{APP_NAME}</h1>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{APP_TAGLINE}</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
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
                  "flex items-center gap-3 rounded-full py-2.5 px-4 text-[13px] font-bold tracking-wide transition-all duration-300",
                  isActive
                    ? "bg-[#a7f3d0] text-[#064e3b] shadow-sm shadow-emerald-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="p-4 space-y-4">
          {/* New Project Action Button */}
          {user.group_id && (
            <button
              onClick={() => router.push("/projects")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 px-4 text-xs font-bold text-white shadow-sm transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          )}

          <div className="border-t border-slate-200/60 pt-3 space-y-1">
            {/* Settings button */}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl py-2 px-4 text-left text-[13px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Settings className="h-4.5 w-4.5 text-slate-400" />
              Settings
            </button>

            {/* Help button */}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex w-full items-center gap-3 rounded-xl py-2 px-4 text-left text-[13px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <HelpCircle className="h-4.5 w-4.5 text-slate-400" />
              Help
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl py-2 px-4 text-left text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5 text-red-400" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Profili Yönet" size="sm">
        <ProfileSettingsForm user={user} />
      </Modal>
    </>
  );
}
