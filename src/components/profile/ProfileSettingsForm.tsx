"use client";

import { useState } from "react";
import type { User } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User as UserIcon } from "lucide-react";

interface ProfileSettingsFormProps {
  user: User;
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [telegramChatId, setTelegramChatId] = useState(user.telegram_chat_id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          telegramChatId: telegramChatId.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Güncelleme başarısız");
      }

      setSuccess("Kaydedildi!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-tider-green to-emerald-600 text-2xl font-bold text-white shadow-md">
            {(user.full_name || user.email).charAt(0).toUpperCase()}
          </div>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="fullName"
            label="Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Adınız Soyadınız"
            required
          />

          <Input
            id="telegramChatId"
            label="Telegram Chat ID (isteğe bağlı)"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder="8261250171"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-tider-green-light px-3 py-2 text-xs text-tider-green-dark">
              {success}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            <UserIcon className="h-4 w-4" />
            Kaydet
          </Button>
        </form>
      </div>
    </div>
  );
}
