"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleAuthGuide } from "@/components/auth/GoogleAuthGuide";
import { EmailConfirmTip } from "@/components/auth/EmailConfirmTip";
import {
  translateAuthError,
  AUTH_PAGE_ERRORS,
} from "@/lib/auth-errors";
import { getAuthCallbackUrl } from "@/lib/app-url";

export function LoginForm() {
  const searchParams = useSearchParams();
  const pageError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    pageError ? AUTH_PAGE_ERRORS[pageError] ?? AUTH_PAGE_ERRORS.auth : ""
  );
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setNeedsConfirmation(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const msg = translateAuthError(authError.message);
        setError(msg);
        if (authError.message === "Email not confirmed") {
          setNeedsConfirmation(true);
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("Oturum oluşturulamadı. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError("Doğrulama e-postası için e-posta adresinizi girin.");
      return;
    }

    setResending(true);
    setError("");
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });

    if (resendError) {
      setError(translateAuthError(resendError.message));
    } else {
      setInfo("Doğrulama e-postası tekrar gönderildi. Gelen kutunuzu kontrol edin.");
      setNeedsConfirmation(false);
    }
    setResending(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (authError) {
      setError(translateAuthError(authError.message));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          id="email"
          label="E-posta"
          type="email"
          placeholder="ornek@tider.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          id="password"
          label="Şifre"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
            {needsConfirmation && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="mt-2 block font-medium text-red-700 underline hover:no-underline"
              >
                {resending ? "Gönderiliyor..." : "Doğrulama e-postasını tekrar gönder"}
              </button>
            )}
          </div>
        )}

        {info && (
          <p className="rounded-lg bg-tider-green-light px-3 py-2 text-sm text-tider-green-dark">
            {info}
          </p>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Giriş Yap
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-500">veya</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        type="button"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google ile Giriş Yap
      </Button>

      <GoogleAuthGuide />

      <EmailConfirmTip />

      <p className="text-center text-sm text-gray-500">
        Hesabınız yok mu?{" "}
        <Link
          href="/signup"
          className="font-medium text-tider-green hover:text-tider-green-dark"
        >
          Kayıt Ol
        </Link>
      </p>
    </div>
  );
}
