import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserGroup {
  id: string;
  name: string;
  owner_id: string;
  role: string;
  created_at?: string;
}

/** Kullanıcının tüm gruplarını getir; group_members yoksa bile owner/group_id fallback */
export async function fetchUserGroups(
  admin: SupabaseClient,
  userId: string,
  activeGroupId: string | null | undefined
): Promise<UserGroup[]> {
  const byId = new Map<string, UserGroup>();

  const addGroup = (
    g: { id: string; name: string; owner_id: string; created_at?: string },
    role: string
  ) => {
    if (!g?.id) return;
    const existing = byId.get(g.id);
    if (!existing || role === "owner") {
      byId.set(g.id, { ...g, role });
    }
  };

  // 1. group_members tablosundan
  const { data: memberships, error: memError } = await admin
    .from("group_members")
    .select("role, group:groups(id, name, owner_id, created_at)")
    .eq("user_id", userId);

  if (!memError && memberships) {
    for (const m of memberships) {
      const g = m.group as unknown as {
        id: string;
        name: string;
        owner_id: string;
        created_at?: string;
      } | null;
      if (g) addGroup(g, m.role as string);
    }
  }

  // 2. Sahip olunan gruplar
  const { data: owned } = await admin
    .from("groups")
    .select("id, name, owner_id, created_at")
    .eq("owner_id", userId);

  for (const g of owned ?? []) {
    addGroup(g, "owner");
  }

  // 3. Aktif grup (users.group_id)
  if (activeGroupId && !byId.has(activeGroupId)) {
    const { data: activeGroup } = await admin
      .from("groups")
      .select("id, name, owner_id, created_at")
      .eq("id", activeGroupId)
      .maybeSingle();

    if (activeGroup) {
      addGroup(
        activeGroup,
        activeGroup.owner_id === userId ? "owner" : "member"
      );
    }
  }

  // 4. group_members kayıtlarını onar (tablo varsa)
  if (!memError) {
    for (const g of byId.values()) {
      await admin.from("group_members").upsert(
        {
          user_id: userId,
          group_id: g.id,
          role: g.role === "owner" ? "owner" : g.role,
        },
        { onConflict: "user_id,group_id" }
      );
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "tr")
  );
}
