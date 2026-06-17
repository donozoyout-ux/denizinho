"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserPlus } from "lucide-react";

interface InviteMemberFormProps {
  onInvited: () => void;
  groupName?: string;
}

export function InviteMemberForm({ onInvited, groupName }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sendEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Davet gönderilemedi");
        return;
      }

      setSuccess(data.message || "Davet gönderildi!");
      setEmail("");
      onInvited();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-tider-green" />
        <h3 className="text-lg font-semibold text-gray-900">Üye Davet Et</h3>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        {groupName ? (
          <>
            <strong>{groupName}</strong> grubuna davet gönderin. Kullanıcı giriş
            yaptığında üst bardaki bildirimlerden görecek.
          </>
        ) : (
          <>
            Davet ettiğiniz kişi sisteme giriş yaptığında, üst bardaki bildirimler
            simgesinden davetinizi görecek.
          </>
        )}
      </p>
      <form onSubmit={handleInvite} className="grid gap-4">
        <Input
          id="inviteEmail"
          label="E-posta Adresi"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="uye@kurum.org"
          required
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="rounded border-gray-300 text-tider-green focus:ring-tider-green"
          />
          E-posta ile de bildir (resmi hesaplar için önerilir)
        </label>
        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          Davet Gönder
        </Button>
      </form>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-tider-green-light px-3 py-2 text-sm text-tider-green-dark">
          {success}
        </p>
      )}
    </div>
  );
}
