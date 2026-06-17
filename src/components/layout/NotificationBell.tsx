"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { playNotificationSound } from "@/lib/sounds";

interface Invitation {
  id: string;
  group_id: string;
  email: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  group?: { id: string; name: string; owner_id: string };
  inviter?: { id: string; full_name: string | null; email: string };
}

const STATUS_LABELS = {
  pending: { text: "Bekliyor", class: "bg-amber-100 text-amber-700" },
  accepted: { text: "Kabul edildi", class: "bg-green-100 text-green-700" },
  rejected: { text: "Reddedildi", class: "bg-gray-100 text-gray-500" },
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const prevPendingRef = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pendingCount = invitations.filter((i) => i.status === "pending").length;

  const fetchInvitations = async (playSound = false) => {
    try {
      const res = await fetch("/api/invitations");
      if (res.ok) {
        const data: Invitation[] = await res.json();
        const newPending = data.filter((i) => i.status === "pending").length;
        if (playSound && newPending > prevPendingRef.current) {
          playNotificationSound();
        }
        prevPendingRef.current = newPending;
        setInvitations(data);
      }
    } catch (err) {
      console.error("Davetiyeler yüklenemedi", err);
    }
  };

  useEffect(() => {
    fetchInvitations();
    const interval = setInterval(() => fetchInvitations(true), 60000);
    return () => clearInterval(interval);
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

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    setActionError("");
    if (nextOpen) fetchInvitations();
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
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === invitationId
              ? { ...inv, status: action === "accept" ? "accepted" : "rejected" }
              : inv
          )
        );
        if (action === "accept") {
          setOpen(false);
          router.push("/dashboard");
          router.refresh();
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        aria-label="Bildirimler"
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white transition-all hover:bg-gray-50 hover:scale-105",
          open && "border-tider-green ring-2 ring-tider-green/20 animate-bounce-in",
          pendingCount > 0 && "animate-pulse-soft"
        )}
      >
        <Bell className={cn("h-5 w-5", pendingCount > 0 ? "text-tider-orange" : "text-gray-600")} />
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-gray-150 bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mb-3 flex items-center justify-between border-b border-gray-50 pb-2">
            <h3 className="font-semibold text-gray-800 text-sm">Bildirimler</h3>
            {pendingCount > 0 && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                {pendingCount} yeni
              </span>
            )}
          </div>

          {actionError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{actionError}</p>
          )}

          {invitations.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">Henüz bildirim yok.</div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {invitations.map((inv) => {
                const statusInfo = STATUS_LABELS[inv.status];
                return (
                  <div
                    key={inv.id}
                    className={cn(
                      "rounded-xl border p-3 text-xs transition-all",
                      inv.status === "pending"
                        ? "border-blue-100 bg-blue-50/50"
                        : "border-gray-100 bg-slate-50/50 opacity-80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900">
                        {inv.group?.name || "Grup Daveti"}
                      </p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusInfo.class)}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-500">
                      <Sparkles className="mr-1 inline h-3 w-3 text-tider-green" />
                      {inv.inviter?.full_name || inv.inviter?.email || "Bilinmeyen"} davet etti
                    </p>

                    {inv.status === "pending" && (
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
