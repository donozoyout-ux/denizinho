"use client";

import { useState } from "react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { AccountModal } from "@/components/profile/AccountModal";
import type { User } from "@/types/database";
import { APP_NAME } from "@/lib/config";
import { Search, ChevronDown, Bell, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface HeaderNavbarProps {
  user: User;
}

export function HeaderNavbar({ user }: HeaderNavbarProps) {
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="flex h-14 md:h-16 items-center justify-between border-b border-slate-100 bg-white px-4 md:px-8 sticky top-0 z-30 shadow-sm">
      {/* Workspace status or Search bar */}
      <div className="flex items-center flex-1 max-w-md">
        {user.group_id ? (
          <div className="relative w-full hidden sm:block">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects, tasks, or team members..."
              className="w-full rounded-full border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all duration-300"
            />
          </div>
        ) : (
          <div className="text-xs font-bold text-slate-500">
            Grup Oluşturun veya Davet Kabul Edin
          </div>
        )}
      </div>

      {/* Right-side notification + profile user block */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* User Block Dropdown trigger */}
        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            className="flex items-center gap-2 rounded-full p-1 border border-slate-150 hover:border-slate-300/50 bg-white shadow-sm cursor-pointer transition duration-300"
          >
            {/* Mock User Avatar Image from screenshots */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 text-xs font-bold text-white uppercase shadow-sm">
              {(user.full_name || user.email).charAt(0)}
            </div>
            
            <span className="hidden sm:block text-xs font-bold text-slate-700 max-w-[100px] truncate px-1">
              {user.full_name || "Admin"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1.5 hidden sm:block" />
          </button>

          {/* Quick Dropdown Menu */}
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDropdown(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200/60 bg-white py-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-xs text-slate-700">
                <div className="px-4 py-2 border-b border-slate-150 font-bold text-slate-800">
                  <span className="block truncate">{user.full_name || "Kullanıcı"}</span>
                  <span className="block text-[10px] text-slate-400 font-medium truncate">{user.email}</span>
                </div>
                
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setAccountOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 transition font-semibold"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Hesap Yönetimi
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-red-50 text-red-600 transition font-semibold"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Çıkış Yap
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Account Settings modal */}
      <AccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        user={user}
      />
    </header>
  );
}
