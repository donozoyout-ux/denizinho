import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fullName, telegramChatId } = body as {
    fullName?: string;
    telegramChatId?: string | null;
  };

  const updateData: Record<string, unknown> = {};
  if (fullName !== undefined) {
    updateData.full_name = fullName.trim();
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
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
