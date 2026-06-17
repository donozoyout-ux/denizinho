"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch (err) {
      console.error("Davetiyeler yüklenemedi", err);
    }
  };

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    setActionError("");
    if (nextOpen) {
      fetchInvitations();
    }
  };

  const handleAction = async (invitationId: string, action: "accept" | "reject") => {
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
          setOpen(false);
          setInvitations([]);
          router.push("/dashboard");
          router.refresh();
        } else {
          setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        }
      } else {
        setActionError(data.error || "Davet işlemi başarısız oldu");
      }
    } catch (err) {
      console.error("Davet işlemi başarısız", err);
      setActionError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        aria-label="Davetler"
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white transition-all hover:bg-gray-50",
          open && "border-tider-green ring-2 ring-tider-green/10"
        )}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {invitations.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {invitations.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-150 bg-white p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mb-3 flex items-center justify-between border-b border-gray-50 pb-2">
            <h3 className="font-semibold text-gray-800 text-sm">Davetler</h3>
            {invitations.length > 0 && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                {invitations.length} Yeni
              </span>
            )}
          </div>

          {actionError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {actionError}
            </p>
          )}

          {invitations.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              Yeni davetiniz bulunmuyor.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-xl border border-gray-100 bg-slate-50/50 p-3 text-xs"
                >
                  <p className="font-semibold text-gray-900">
                    {inv.group?.name || "Grup Daveti"}
                  </p>
                  <p className="mt-1 text-gray-500">
                    <Sparkles className="mr-1 inline h-3 w-3 text-tider-green" />
                    {inv.inviter?.full_name || inv.inviter?.email || "Bilinmeyen"} davet etti.
                  </p>

                  <div className="mt-3 flex gap-1.5 justify-end">
                    <button
                      onClick={() => handleAction(inv.id, "accept")}
                      disabled={processingId === inv.id}
                      className="flex items-center gap-1 rounded-lg bg-tider-green px-2.5 py-1.5 font-medium text-white shadow-sm hover:bg-tider-green-dark transition-colors disabled:opacity-50"
                    >
                      {processingId === inv.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Kabul Et
                    </button>
                    <button
                      onClick={() => handleAction(inv.id, "reject")}
                      disabled={processingId === inv.id}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
