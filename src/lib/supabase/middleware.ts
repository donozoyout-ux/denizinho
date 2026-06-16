import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const PUBLIC_API_PATHS = [
  "/api/webhook/email",
  "/api/incoming-requests",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const isPublicWebhook =
    request.method === "POST" &&
    PUBLIC_API_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isPublicWebhook) {
    return supabaseResponse;
  }

  const env = getSupabaseEnv();
  if (!env) {
    return supabaseResponse;
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/board") ||
    request.nextUrl.pathname.startsWith("/table") ||
    request.nextUrl.pathname.startsWith("/import") ||
    request.nextUrl.pathname.startsWith("/team") ||
    request.nextUrl.pathname.startsWith("/api/tasks") ||
    (request.nextUrl.pathname.startsWith("/api/incoming-requests") &&
      request.method !== "POST") ||
    request.nextUrl.pathname.startsWith("/api/import") ||
    request.nextUrl.pathname.startsWith("/api/email") ||
    request.nextUrl.pathname.startsWith("/api/team");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
