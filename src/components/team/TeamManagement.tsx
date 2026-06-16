"use client";

import { useState } from "react";
import type { User } from "@/types/database";
import { TeamMemberList } from "./TeamMemberList";
import { InviteMemberForm } from "./InviteMemberForm";

interface TeamManagementProps {
  initialMembers: User[];
}

export function TeamManagement({ initialMembers }: TeamManagementProps) {
  const [members, setMembers] = useState(initialMembers);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshMembers = async () => {
    const res = await fetch("/api/team");
    if (res.ok) {
      const data = await res.json();
      setMembers(data);
    }
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-8">
      <InviteMemberForm onInvited={refreshMembers} />
      <TeamMemberList key={refreshKey} members={members} onRefresh={refreshMembers} />
    </div>
  );
}
