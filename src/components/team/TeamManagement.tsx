"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types/database";
import { TeamMemberList } from "./TeamMemberList";
import { InviteMemberForm } from "./InviteMemberForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupInfo {
  id: string;
  name: string;
  owner_id: string;
  role: string;
}

interface TeamManagementProps {
  initialMembers: User[];
  initialGroups: GroupInfo[];
  activeGroupId: string | null;
}

export function TeamManagement({
  initialMembers,
  initialGroups,
  activeGroupId,
}: TeamManagementProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupInfo[]>(initialGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(
    activeGroupId || initialGroups[0]?.id || ""
  );
  const [members, setMembers] = useState(initialMembers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [createError, setCreateError] = useState("");

  const refreshMembers = useCallback(async (groupId: string) => {
    const res = await fetch(`/api/team?groupId=${groupId}`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data);
    }
  }, []);

  const refreshGroups = useCallback(async () => {
    const res = await fetch("/api/groups");
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups ?? []);
      if (data.activeGroupId) setSelectedGroupId(data.activeGroupId);
    }
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      refreshMembers(selectedGroupId);
    }
  }, [selectedGroupId, refreshMembers]);

  const handleSwitchGroup = async (groupId: string) => {
    if (groupId === selectedGroupId) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/groups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (res.ok) {
        setSelectedGroupId(groupId);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, setActive: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Grup oluşturulamadı");
        return;
      }
      setNewGroupName("");
      setShowCreateModal(false);
      await refreshGroups();
      setSelectedGroupId(data.id);
      router.refresh();
    } catch {
      setCreateError("Bağlantı hatası");
    } finally {
      setCreating(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="space-y-6">
      {/* Grup sekmeleri */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Gruplarım</h3>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Grup Oluştur
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleSwitchGroup(group.id)}
              disabled={switching}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                selectedGroupId === group.id
                  ? "border-tider-green bg-tider-green-light text-tider-green-dark shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <Users className="h-4 w-4" />
              {group.name}
              {group.role === "owner" && (
                <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-tider-green">
                  Sahip
                </span>
              )}
            </button>
          ))}
          {groups.length === 0 && (
            <p className="text-sm text-gray-400">Henüz grubunuz yok.</p>
          )}
        </div>
      </div>

      {selectedGroup && (
        <>
          <InviteMemberForm
            onInvited={() => refreshMembers(selectedGroupId)}
            groupName={selectedGroup.name}
          />
          <TeamMemberList
            members={members}
            onRefresh={() => refreshMembers(selectedGroupId)}
          />
        </>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yeni Grup Oluştur"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            id="groupName"
            label="Grup Adı"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Örn: İstanbul Ekibi"
            required
          />
          {createError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              İptal
            </Button>
            <Button type="submit" loading={creating}>
              Oluştur
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
