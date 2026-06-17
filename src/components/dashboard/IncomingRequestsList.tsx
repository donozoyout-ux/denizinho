"use client";

import { useState } from "react";
import type { IncomingRequest } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Mail, ArrowRight, X, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface IncomingRequestsListProps {
  requests: IncomingRequest[];
}

export function IncomingRequestsList({ requests: initial }: IncomingRequestsListProps) {
  const [requests, setRequests] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/cron/email-sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Senkronizasyon başarısız");
      setSyncMessage(
        data.processed
          ? `${data.processed} e-posta işlendi`
          : "Senkronizasyon tamamlandı"
      );
      window.location.reload();
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setSyncing(false);
    }
  };

  const handleConvert = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/incoming-requests/${id}/convert`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "converted" as const } : r))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Dönüştürme başarısız");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/incoming-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });

      if (!res.ok) throw new Error("Reddetme başarısız");

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "dismissed" as const } : r))
      );
    } catch {
      alert("İşlem başarısız");
    } finally {
      setLoadingId(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">
          Bağlı e-posta kutunuzdan AI ile görev ayıklanır (15 dk&apos;da bir otomatik).
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          loading={syncing}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Şimdi Senkronize Et
        </Button>
      </div>
      {syncMessage && (
        <p className="text-sm text-gray-600 rounded-lg bg-slate-50 px-3 py-2">{syncMessage}</p>
      )}

      {pending.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Bekleyen talep yok"
          description="E-posta kutunuzdaki görev içeren mesajlar burada görünecek. Senkronize Et butonunu deneyin."
        />
      ) : (
        <div className="space-y-3">
          {pending.map((request) => (
            <div
              key={request.id}
              className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-tider-orange-light">
                <Mail className="h-5 w-5 text-tider-orange" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {request.subject || "Konu belirtilmemiş"}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {request.sender_email} · {formatDateTime(request.created_at)}
                    </p>
                  </div>
                </div>
                {request.body && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                    {request.body}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleConvert(request.id)}
                    loading={loadingId === request.id}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Göreve Dönüştür
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(request.id)}
                    disabled={loadingId === request.id}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reddet
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
