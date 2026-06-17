import { NextResponse } from "next/server";
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
  const supabase = admin || (await createClient());

  // 1. Grup oluştur
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single();

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  // 2. Kullanıcının group_id'sini güncelle
  const { error: updateError } = await supabase
    .from("users")
    .update({ group_id: group.id })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(group, { status: 201 });
}
