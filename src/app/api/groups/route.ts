import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { fetchUserGroups } from "@/lib/groups-server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik" },
      { status: 503 }
    );
  }

  const groups = await fetchUserGroups(admin, user.id, user.group_id);

  return NextResponse.json({
    activeGroupId: user.group_id,
    groups,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, setActive } = body as { name: string; setActive?: boolean };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Grup adı gerekli" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 503 }
    );
  }

  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single();

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  await admin.from("group_members").upsert(
    { user_id: user.id, group_id: group.id, role: "owner" },
    { onConflict: "user_id,group_id" }
  );

  if (!user.group_id || setActive !== false) {
    const { data: updatedUser, error: updateError } = await admin
      .from("users")
      .update({ group_id: group.id })
      .eq("id", user.id)
      .select("id, group_id")
      .single();

    if (updateError || !updatedUser?.group_id) {
      return NextResponse.json(
        { error: updateError?.message || "Aktif grup ayarlanamadı" },
        { status: 500 }
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/team");
  revalidatePath("/board");

  return NextResponse.json(group, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { groupId } = body as { groupId: string };

  if (!groupId) {
    return NextResponse.json({ error: "Grup ID gerekli" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik" },
      { status: 503 }
    );
  }

  const { data: membership } = await admin
    .from("group_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "Bu grubun üyesi değilsiniz" },
      { status: 403 }
    );
  }

  const { data: updatedUser, error: updateError } = await admin
    .from("users")
    .update({ group_id: groupId })
    .eq("id", user.id)
    .select("id, group_id")
    .single();

  if (updateError || !updatedUser?.group_id) {
    return NextResponse.json(
      { error: updateError?.message || "Grup değiştirilemedi" },
      { status: 500 }
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/team");
  revalidatePath("/board");

  return NextResponse.json({ message: "Aktif grup değiştirildi", groupId });
}
