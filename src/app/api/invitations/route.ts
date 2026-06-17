import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email/send-notification";

function getUserEmails(userEmail: string, authEmail?: string | null): string[] {
  const emails = new Set<string>();
  if (userEmail) emails.add(userEmail.toLowerCase());
  if (authEmail) emails.add(authEmail.toLowerCase());
  return Array.from(emails);
}

function requireAdminClient() {
  const admin = createAdminClient();
  if (!admin) {
    return {
      error: NextResponse.json(
        { error: "Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 503 }
      ),
    };
  }
  return { admin };
}

// GET: Kullanıcıya gelen davetleri listele
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAuth = await createClient();
  const {
    data: { user: authUser },
  } = await supabaseAuth.auth.getUser();

  const emails = getUserEmails(user.email, authUser?.email);
  if (emails.length === 0) {
    return NextResponse.json([]);
  }

  const { admin, error: adminError } = requireAdminClient();
  if (adminError) return adminError;

  const { data, error } = await admin!
    .from("invitations")
    .select(
      "*, group:groups(id, name, owner_id), inviter:users!invitations_inviter_id_fkey(id, full_name, email)"
    )
    .in("email", emails)
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
  const { email, fullName, sendEmail } = body as {
    email: string;
    fullName?: string;
    sendEmail?: boolean;
  };

  if (!email?.includes("@")) {
    return NextResponse.json(
      { error: "Geçerli bir e-posta adresi girin" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { admin, error: adminError } = requireAdminClient();
  if (adminError) return adminError;

  // Zaten grupta mı kontrol et
  const { data: existingUser } = await admin!
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
  const { data: existingInvite } = await admin!
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
  const { data: invitation, error: invError } = await admin!
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

  // E-posta: SEND_INVITE_EMAIL=true veya istemci sendEmail=true ise gönder
  const shouldSendEmail =
    sendEmail === true || process.env.SEND_INVITE_EMAIL === "true";

  if (shouldSendEmail) {
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
  }

  return NextResponse.json(
    {
      message:
        "Davet gönderildi. Kullanıcı giriş yaptığında üst bardaki bildirimlerden görecek.",
      invitation,
    },
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

  const supabaseAuth = await createClient();
  const {
    data: { user: authUser },
  } = await supabaseAuth.auth.getUser();
  const emails = getUserEmails(user.email, authUser?.email);

  const { admin, error: adminError } = requireAdminClient();
  if (adminError) return adminError;

  // Daveti bul
  const { data: invitation, error: findError } = await admin!
    .from("invitations")
    .select("*")
    .eq("id", invitationId)
    .in("email", emails)
    .eq("status", "pending")
    .single();

  if (findError || !invitation) {
    return NextResponse.json(
      { error: "Davet bulunamadı veya zaten işlendi" },
      { status: 404 }
    );
  }

  if (action === "reject") {
    const { error: rejectError } = await admin!
      .from("invitations")
      .update({ status: "rejected" })
      .eq("id", invitationId);

    if (rejectError) {
      return NextResponse.json({ error: rejectError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Davet reddedildi" });
  }

  // Kabul et: gruba üye ekle ve aktif grup olarak ayarla
  await admin!
    .from("group_members")
    .upsert(
      { user_id: user.id, group_id: invitation.group_id, role: "member" },
      { onConflict: "user_id,group_id" }
    );

  const { data: updatedUser, error: updateError } = await admin!
    .from("users")
    .update({ group_id: invitation.group_id })
    .eq("id", user.id)
    .select("id, group_id")
    .single();

  if (updateError || !updatedUser?.group_id) {
    return NextResponse.json(
      { error: updateError?.message || "Gruba katılım başarısız" },
      { status: 500 }
    );
  }

  const { error: statusError } = await admin!
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId);

  if (statusError) {
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/group-setup");
  revalidatePath("/team");
  revalidatePath("/board");

  return NextResponse.json({
    message: "Daveti kabul ettiniz! Artık grubun bir üyesisiniz.",
  });
}
