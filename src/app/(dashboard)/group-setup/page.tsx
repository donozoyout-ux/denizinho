"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Mail, Check, X, Loader2, Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/config";

interface PendingInvitation {
  id: string;
  group_id: string;
  email: string;
  created_at: string;
  group?: {
    id: string;
    name: string;
    owner_id: string;
  };
  inviter?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export default function GroupSetupPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch {
      console.error("Davetler yüklenemedi");
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Grup oluşturulamadı");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: "accept" | "reject") => {
    setProcessingId(invitationId);
    setActionError("");
    try {
      const res = await fetch("/api/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action }),
      });

      const data = await res.json();

      if (res.ok) {
        if (action === "accept") {
          router.push("/dashboard");
          router.refresh();
        } else {
          setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        }
      } else {
        setActionError(data.error || "Davet işlemi başarısız oldu");
      }
    } catch {
      setActionError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo / Branding */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-tider-green to-emerald-600 shadow-lg shadow-green-200">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Başlamak için bir grup oluşturun veya size gelen bir daveti kabul edin.
          </p>
        </div>

        {/* Gelen Davetler */}
        {actionError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {actionError}
          </p>
        )}
        {loadingInvitations ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-400">Davetler yükleniyor…</span>
          </div>
        ) : invitations.length > 0 ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-blue-900">
                Size Gelen Davetler ({invitations.length})
              </h2>
            </div>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl border border-blue-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {inv.group?.name || "Grup"}
                    </p>
                    <p className="text-xs text-gray-500">
                      <Sparkles className="mr-1 inline-block h-3 w-3" />
                      {inv.inviter?.full_name || inv.inviter?.email || "Bilinmeyen"} tarafından davet edildiniz
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInvitation(inv.id, "accept")}
                      disabled={processingId === inv.id}
                      className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {processingId === inv.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Kabul Et
                    </button>
                    <button
                      onClick={() => handleInvitation(inv.id, "reject")}
                      disabled={processingId === inv.id}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Ayırıcı */}
        {invitations.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gradient-to-br from-slate-50 via-white to-green-50 px-3 text-gray-500">
                veya
              </span>
            </div>
          </div>
        )}

        {/* Grup Oluştur */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-tider-green" />
            <h2 className="font-semibold text-gray-900">Yeni Grup Oluştur</h2>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Kendi grubunuzu oluşturun ve ekip üyelerini davet edin. Grubunuzdaki
            herkes görevleri ve talepleri ortaklaşa yönetebilir.
          </p>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label
                htmlFor="groupName"
                className="block text-sm font-medium text-gray-700"
              >
                Grup Adı
              </label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Orn: Marmara Saha Ekibi"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-tider-green focus:outline-none focus:ring-1 focus:ring-tider-green"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-tider-green to-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Grup Oluştur
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
