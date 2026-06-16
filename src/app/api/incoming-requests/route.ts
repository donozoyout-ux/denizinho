import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function verifyWebhookKey(request: Request): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.INCOMING_WEBHOOK_API_KEY;
  if (!expectedKey) return true;
  return apiKey === expectedKey;
}

export async function POST(request: Request) {
  if (!verifyWebhookKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const admin = createAdminClient();
  const supabase = admin ?? (await createClient());

  const { data, error } = await supabase
    .from("incoming_requests")
    .insert({
      subject: body.subject || null,
      body: body.body || null,
      sender_email: body.sender_email || body.from || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
