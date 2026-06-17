"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserPlus } from "lucide-react";

interface InviteMemberFormProps {
  onInvited: () => void;
}

export function InviteMemberForm({ onInvited }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email }),
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
        Davet ettiğiniz kişi sisteme giriş yaptığında, ana sayfasında davetinizi görecek.
        Kabul ederse grubunuza otomatik olarak dahil olur.
      </p>
      <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
        <Input
          id="inviteEmail"
          label="E-posta Adresi"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="uye@tider.org"
          required
        />
        <div className="flex items-end">
          <Button type="submit" loading={loading} className="w-full">
            Davet Gönder
          </Button>
        </div>
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
