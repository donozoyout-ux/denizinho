"use client";

import { useState } from "react";
import type { User } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MessageSquare, Info } from "lucide-react";

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

      setSuccess("Profil bilgileriniz başarıyla güncellendi!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-500">E-posta Adresi</label>
              <div className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                {user.email}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Sistem Rolü</label>
              <div className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 capitalize">
                {user.role === "patron" ? "Patron (Yönetici)" : "Ekip Üyesi"}
              </div>
            </div>
          </div>

          <Input
            id="fullName"
            label="Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Adınız Soyadınız"
            required
          />

          <div className="space-y-2">
            <Input
              id="telegramChatId"
              label="Telegram Chat ID"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Örn: 8261250171"
            />
            <p className="text-xs text-gray-400">
              {"Görev atamalarında Telegram üzerinden otomatik bildirim almak için Chat ID'nizi girin."}
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-tider-green-light px-3 py-2 text-sm text-tider-green-dark">
              {success}
            </p>
          )}

          <Button type="submit" loading={loading}>
            Ayarları Kaydet
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <MessageSquare className="h-5 w-5 text-tider-green" />
          <h4>Telegram Bildirimi Nasıl Aktif Edilir?</h4>
        </div>
        <div className="text-sm text-gray-600 space-y-3">
          <p>{"Telegram'dan görev bildirimleri almak için şu adımları izleyin:"}</p>
          <ol className="list-decimal pl-4 space-y-2">
            <li>
              Patronunuzun oluşturduğu Telegram botuna gidin ve botu başlatmak için <b>Başlat (Start)</b> butonuna basın.
            </li>
            <li>
              {"Kendi Telegram Chat ID'nizi öğrenmek için Telegram'da "}
              <a 
                href="https://t.me/userinfobot" 
                target="_blank" 
                rel="noreferrer"
                className="font-medium text-tider-green hover:underline ml-1"
              >
                @userinfobot
              </a>{"'a "}
              mesaj gönderin. Size sayısal bir ID verecektir (Örn: 8261250171).
            </li>
            <li>{"Aldığınız bu ID'yi soldaki forma yapıştırıp "}<b>Ayarları Kaydet</b>{" deyin."}</li>
          </ol>
          <div className="rounded-lg bg-blue-50 p-3 flex gap-2 text-xs text-blue-800">
            <Info className="h-4 w-4 flex-shrink-0" />
            <p>Bota en az bir kere /start mesajı göndermezseniz, sistem size bildirim gönderemez.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
