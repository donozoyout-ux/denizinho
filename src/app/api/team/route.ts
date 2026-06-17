import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { getGroupMembers } from "@/lib/groups-server";
import type { UserRole } from "@/types/database";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) {
    return NextResponse.json({ error: "groupId gerekli" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik" },
      { status: 503 }
    );
  }

  const members = await getGroupMembers(admin, groupId);
  return NextResponse.json(members);
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, role, telegramChatId } = body as {
    userId: string;
    role?: UserRole;
    telegramChatId?: string | null;
  };

  if (!userId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (role !== undefined) {
    if (!["patron", "team_member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updateData.role = role;
  }
  if (telegramChatId !== undefined) {
    updateData.telegram_chat_id = telegramChatId ? telegramChatId.trim() : null;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik" },
      { status: 503 }
    );
  }

  const { data, error } = await admin
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
