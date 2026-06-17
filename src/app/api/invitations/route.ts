import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email/send-notification";

// GET: Kullanıcıya gelen davetleri listele
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const supabase = admin || (await createClient());

  const { data, error } = await supabase
    .from("invitations")
    .select("*, group:groups(id, name, owner_id), inviter:users!invitations_inviter_id_fkey(id, full_name, email)")
    .eq("email", user.email.toLowerCase())
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST: Yeni davet gönder (grup üyesi tarafından)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.group_id) {
    return NextResponse.json(
      { error: "Önce bir grup oluşturmalısınız" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { email, fullName } = body as { email: string; fullName?: string };

  if (!email?.includes("@")) {
    return NextResponse.json(
      { error: "Geçerli bir e-posta adresi girin" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const admin = createAdminClient();
  const supabase = admin || (await createClient());

  // Zaten grupta mı kontrol et
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, group_id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingUser?.group_id === user.group_id) {
    return NextResponse.json(
      { error: "Bu kullanıcı zaten grubunuzda" },
      { status: 409 }
    );
  }

  // Zaten bekleyen davet var mı?
  const { data: existingInvite } = await supabase
    .from("invitations")
    .select("id")
    .eq("group_id", user.group_id)
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json(
      { error: "Bu kullanıcıya zaten bekleyen bir davet var" },
      { status: 409 }
    );
  }

  // Davet oluştur
  const { data: invitation, error: invError } = await supabase
    .from("invitations")
    .insert({
      group_id: user.group_id,
      email: normalizedEmail,
      inviter_id: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (invError) {
    return NextResponse.json({ error: invError.message }, { status: 500 });
  }

  // E-posta gönder
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    await sendInviteEmail({
      to: normalizedEmail,
      fullName: fullName || normalizedEmail,
      invitedBy: user.full_name || user.email,
      signupUrl: `${appUrl}/login`,
    });
  } catch (emailErr) {
    console.error("[Invitations] E-posta gönderilemedi:", emailErr);
  }

  return NextResponse.json(
    { message: "Davet başarıyla gönderildi", invitation },
    { status: 201 }
  );
}

// PATCH: Daveti kabul et veya reddet
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { invitationId, action } = body as {
    invitationId: string;
    action: "accept" | "reject";
  };

  if (!invitationId || !["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const admin = createAdminClient();
  const supabase = admin || (await createClient());

  // Daveti bul
  const { data: invitation, error: findError } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("email", user.email.toLowerCase())
    .eq("status", "pending")
    .single();

  if (findError || !invitation) {
    return NextResponse.json(
      { error: "Davet bulunamadı veya zaten işlendi" },
      { status: 404 }
    );
  }

  if (action === "reject") {
    await supabase
      .from("invitations")
      .update({ status: "rejected" })
      .eq("id", invitationId);

    return NextResponse.json({ message: "Davet reddedildi" });
  }

  // Kabul et: kullanıcının group_id'sini güncelle
  const { error: updateError } = await supabase
    .from("users")
    .update({ group_id: invitation.group_id })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Davet durumunu güncelle
  await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId);

  return NextResponse.json({ message: "Daveti kabul ettiniz! Artık grubun bir üyesisiniz." });
}
