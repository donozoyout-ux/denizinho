import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, isGroupAdmin } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email/send-notification";
import type { UserRole } from "@/types/database";
import { randomUUID } from "crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Yönetici: kendisi + davet ettikleri. Üye: kendi grubundakiler.
  let query = supabase.from("users").select("*").order("full_name");

  if (isGroupAdmin(user)) {
    query = query.or(`id.eq.${user.id},invited_by.eq.${user.id}`);
  } else if (user.invited_by) {
    query = query.or(`id.eq.${user.invited_by},invited_by.eq.${user.invited_by}`);
  } else {
    query = query.eq("id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isGroupAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, fullName, role = "team_member" } = body as {
    email: string;
    fullName: string;
    role?: UserRole;
  };

  if (!email?.includes("@") || !fullName?.trim()) {
    return NextResponse.json(
      { error: "Geçerli e-posta ve ad soyad gerekli" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const admin = createAdminClient();
  const supabase = await createClient();
  const client = admin || supabase;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 1. Kullanıcı zaten public.users tablosunda mı?
  const { data: existingMember } = await client
    .from("users")
    .select("id, email, invited_by")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingMember) {
    // Zaten benim ekibimde mi?
    if (existingMember.invited_by === user.id || existingMember.id === user.id) {
      return NextResponse.json(
        { error: "Bu e-posta zaten ekibinizde" },
        { status: 409 }
      );
    }

    // Sistemde var ama benim ekibimde değil → ekibime ekle
    await client
      .from("users")
      .update({ invited_by: user.id, full_name: fullName.trim(), role })
      .eq("id", existingMember.id);

    return NextResponse.json(
      { message: "Üye ekibinize eklendi" },
      { status: 201 }
    );
  }

  // 2. public.users'da yok → Doğrudan veritabanına ekle
  const newUserId = randomUUID();
  const { error: insertError } = await client
    .from("users")
    .insert({
      id: newUserId,
      email: normalizedEmail,
      full_name: fullName.trim(),
      role,
      invited_by: user.id,
    });

  if (insertError) {
    console.error("[Team] Üye eklenirken veritabanı hatası:", insertError);
    return NextResponse.json(
      { error: "Üye eklenirken hata oluştu: " + insertError.message },
      { status: 500 }
    );
  }

  // 3. Davet/Bilgilendirme e-postası gönder
  try {
    await sendInviteEmail({
      to: normalizedEmail,
      fullName: fullName.trim(),
      invitedBy: user.full_name || user.email,
      signupUrl: `${appUrl}/login`,
    });
  } catch (emailErr) {
    console.error("[Team] Davet e-postası gönderilemedi:", emailErr);
  }

  return NextResponse.json(
    { message: "Üye başarıyla eklendi" },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isGroupAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const supabase = await createClient();
  const { data, error } = await supabase
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
