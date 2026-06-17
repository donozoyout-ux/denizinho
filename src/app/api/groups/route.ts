import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Kullanıcının kendi grubunu getir
  if (user.group_id) {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", user.group_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json(null);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.group_id) {
    return NextResponse.json(
      { error: "Zaten bir gruba üyesiniz" },
      { status: 409 }
    );
  }

  const body = await request.json();
  const { name } = body as { name: string };

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Grup adı gerekli" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 503 }
    );
  }

  // 1. Grup oluştur
  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single();

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  // 2. Kullanıcının group_id'sini güncelle ve doğrula
  const { data: updatedUser, error: updateError } = await admin
    .from("users")
    .update({ group_id: group.id })
    .eq("id", user.id)
    .select("id, group_id")
    .single();

  if (updateError || !updatedUser?.group_id) {
    return NextResponse.json(
      { error: updateError?.message || "Gruba katılım başarısız" },
      { status: 500 }
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/group-setup");
  revalidatePath("/team");

  return NextResponse.json(group, { status: 201 });
}
