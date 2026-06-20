import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  // Extract query parameters from the callback URL
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Use the site URL defined in environment (Netlify deployment) for redirects
  // Fallback to the request origin for local development
  const requestUrl = new URL(request.url);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    requestUrl.origin;

  if (errorParam) {
    console.error("[auth/callback] OAuth error:", errorParam, errorDescription);
    // Redirect to login page on the site URL
    return NextResponse.redirect(`${siteUrl}/login?error=oauth`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful authentication, redirect to the intended page
      return NextResponse.redirect(`${siteUrl}${next}`);
    }

    console.error("[auth/callback] Session exchange failed:", error.message);
    const isConfirmError = error.message.toLowerCase().includes("confirm");
    // Redirect with appropriate error param
    return NextResponse.redirect(
      `${siteUrl}/login?error=${isConfirmError ? "confirm" : "auth"}`
    );
  }

  // Fallback if no code is present
  return NextResponse.redirect(`${siteUrl}/login?error=auth`);
}
