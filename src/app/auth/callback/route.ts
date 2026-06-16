import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    console.error("[auth/callback] OAuth error:", errorParam, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] Session exchange failed:", error.message);
    const isConfirmError = error.message.toLowerCase().includes("confirm");
    return NextResponse.redirect(
      `${origin}/login?error=${isConfirmError ? "confirm" : "auth"}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
