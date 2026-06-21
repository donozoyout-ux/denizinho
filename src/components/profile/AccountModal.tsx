"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import type { User } from "@/types/database";
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  LogOut, 
  ChevronRight,
  Sparkles
} from "lucide-react";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

type TabType = "menu" | "profile" | "notifications" | "security";

export function AccountModal({ open, onClose, user }: AccountModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("menu");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifTelegram, setNotifTelegram] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/login");
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setActiveTab("menu");
        onClose();
      }}
      title={activeTab === "menu" ? "Hesap Yönetimi" : "Geri Dön"}
      size="sm"
    >
      {activeTab === "menu" ? (
        <div className="space-y-4 py-2 animate-in fade-in duration-200">
          {/* Option: Profile */}
          <button
            onClick={() => setActiveTab("profile")}
            className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-slate-50/50 p-4 text-left transition hover:bg-slate-100/70"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-900">Profil Ayarları</span>
                <span className="block text-xs text-gray-500">Kişisel bilgilerinizi güncelleyin</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          {/* Option: Notifications */}
          <button
            onClick={() => setActiveTab("notifications")}
            className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-slate-50/50 p-4 text-left transition hover:bg-slate-100/70"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-900">Bildirim Ayarları</span>
                <span className="block text-xs text-gray-500">Uyarı tercihlerinizi yönetin</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          {/* Option: Security */}
          <button
            onClick={() => setActiveTab("security")}
            className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-slate-50/50 p-4 text-left transition hover:bg-slate-100/70"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0369a1]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-900">Güvenlik</span>
                <span className="block text-xs text-gray-500">Şifre ve erişim kontrolleri</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          {/* Option: Logout */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl bg-red-50 p-4 text-left transition hover:bg-red-100/80 mt-4 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white group-hover:scale-105 transition-transform">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-red-900">Çıkış Yap</span>
              <span className="block text-xs text-red-700">Oturumu sonlandırın</span>
            </div>
          </button>
        </div>
      ) : activeTab === "profile" ? (
        <div className="animate-in fade-in duration-200">
          <button 
            onClick={() => setActiveTab("menu")} 
            className="mb-4 text-xs font-bold text-slate-500 hover:text-emerald-800 transition"
          >
            ← Menüye Dön
          </button>
          <ProfileSettingsForm user={user} />
        </div>
      ) : activeTab === "notifications" ? (
        <div className="space-y-4 py-2 animate-in fade-in duration-200">
          <button 
            onClick={() => setActiveTab("menu")} 
            className="mb-2 text-xs font-bold text-slate-500 hover:text-emerald-800 transition"
          >
            ← Menüye Dön
          </button>
          
          <h3 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Bildirim Tercihleri</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={notifEmail}
                onChange={(e) => setNotifEmail(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-gray-200 text-emerald-800 focus:ring-emerald-800"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800">E-posta Bildirimleri</span>
                <span className="block text-[10px] text-slate-400">Yeni görev atandığında mail al</span>
              </div>
            </label>

            <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={notifTelegram}
                onChange={(e) => setNotifTelegram(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-gray-200 text-emerald-800 focus:ring-emerald-800"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800">Telegram Bildirimleri</span>
                <span className="block text-[10px] text-slate-400">Telegram botu üzerinden uyarı al</span>
              </div>
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-2 animate-in fade-in duration-200">
          <button 
            onClick={() => setActiveTab("menu")} 
            className="mb-2 text-xs font-bold text-slate-500 hover:text-emerald-800 transition"
          >
            ← Menüye Dön
          </button>
          
          <h3 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Güvenlik ve Erişim</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hesabınızın güvenliği sistemimiz tarafından otomatik olarak şifrelenmiştir. Şifrenizi değiştirmek için lütfen sistem yöneticinizle irtibata geçin veya Supabase üzerinden sıfırlama talep edin.
          </p>
        </div>
      )}
    </Modal>
  );
}
