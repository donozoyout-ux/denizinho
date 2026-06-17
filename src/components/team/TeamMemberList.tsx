"use client";

import { useState } from "react";
import type { User } from "@/types/database";
import { isGroupAdmin } from "@/lib/auth-client";
import { RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Shield, Edit2, Check, X } from "lucide-react";

interface TeamMemberListProps {
  members: User[];
  onRefresh?: () => void;
}

export function TeamMemberList({ members: initial, onRefresh }: TeamMemberListProps) {
  const [members, setMembers] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingTelegramId, setEditingTelegramId] = useState<string | null>(null);
  const [telegramInputVal, setTelegramInputVal] = useState("");

  const toggleRole = async (member: User) => {
    const newRole = isGroupAdmin(member) ? "team_member" : "patron";
    setLoadingId(member.id);

    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id, role: newRole }),
      });

      if (!res.ok) throw new Error("Rol güncellenemedi");

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, role: newRole } : m
        )
      );
      onRefresh?.();
    } catch {
      alert("Rol güncelleme başarısız");
    } finally {
      setLoadingId(null);
    }
  };

  const startEditTelegram = (member: User) => {
    setEditingTelegramId(member.id);
    setTelegramInputVal(member.telegram_chat_id || "");
  };

  const saveTelegramId = async (member: User) => {
    setLoadingId(member.id);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id, telegramChatId: telegramInputVal }),
      });

      if (!res.ok) throw new Error("Telegram ID güncellenemedi");

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, telegram_chat_id: telegramInputVal } : m
        )
      );
      setEditingTelegramId(null);
      onRefresh?.();
    } catch {
      alert("Telegram ID güncelleme başarısız");
    } finally {
      setLoadingId(null);
    }
  };

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Henüz ekip üyesi yok"
        description="Yukarıdan üye davet edin veya /signup ile kayıt olun."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-6 py-3 font-medium text-gray-600">Ad Soyad</th>
            <th className="px-6 py-3 font-medium text-gray-600">E-posta</th>
            <th className="px-6 py-3 font-medium text-gray-600">Rol</th>
            <th className="px-6 py-3 font-medium text-gray-600">Telegram Chat ID</th>
            <th className="px-6 py-3 font-medium text-gray-600">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50/50">
              <td className="px-6 py-4 font-medium text-gray-900">
                <div className="font-semibold">{member.full_name || "—"}</div>
                <div className="text-xs text-gray-400 font-normal mt-0.5">
                  Kullanıcı
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500">{member.email}</td>
              <td className="px-6 py-4">
                <RoleBadge isAdmin={isGroupAdmin(member)} />
              </td>
              <td className="px-6 py-4">
                {editingTelegramId === member.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={telegramInputVal}
                      onChange={(e) => setTelegramInputVal(e.target.value)}
                      placeholder="Örn: 12345678"
                      className="w-32 rounded border border-gray-300 px-2.5 py-1 text-xs focus:border-tider-green focus:outline-none"
                    />
                    <button
                      onClick={() => saveTelegramId(member)}
                      className="rounded p-1 text-green-600 hover:bg-green-50"
                      title="Kaydet"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingTelegramId(null)}
                      className="rounded p-1 text-red-600 hover:bg-red-50"
                      title="İptal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="font-mono text-xs">
                      {member.telegram_chat_id || "Eklenmemiş"}
                    </span>
                    <button
                      onClick={() => startEditTelegram(member)}
                      className="rounded p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="Telegram ID Düzenle"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
