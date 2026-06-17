"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleAuthGuide } from "@/components/auth/GoogleAuthGuide";
import { translateAuthError } from "@/lib/auth-errors";
import { getAuthCallbackUrl } from "@/lib/app-url";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patron" | "team_member">("team_member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });

    if (authError) {
      setError(translateAuthError(authError.message));
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.href = "/dashboard";
      return;
    }

    setSuccess(true);
    setNeedsEmailConfirm(true);
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
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

  if (success) {
    return (
      <div className="rounded-xl bg-tider-green-light p-6 text-center">
        <h3 className="text-lg font-semibold text-tider-green-dark">
          Kayıt Başarılı!
        </h3>
        {needsEmailConfirm ? (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            E-posta adresinize bir doğrulama bağlantısı gönderildi.
            <strong> Giriş yapabilmek için önce e-postanızdaki bağlantıya tıklayın.</strong>
            {" "}Spam klasörünü de kontrol edin.
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            Hesabınız oluşturuldu. Giriş yapabilirsiniz.
          </p>
        )}
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => router.push("/login")}
        >
          Giriş Sayfasına Git
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          id="fullName"
          label="Ad Soyad"
          type="text"
          placeholder="Adınız Soyadınız"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
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
          placeholder="En az 6 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />



        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Kayıt Ol
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
        onClick={handleGoogleSignup}
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
        Google ile Kayıt Ol
      </Button>

      <GoogleAuthGuide />

      <p className="text-center text-sm text-gray-500">
        Zaten hesabınız var mı?{" "}
        <Link
          href="/login"
          className="font-medium text-tider-green hover:text-tider-green-dark"
        >
          Giriş Yap
        </Link>
      </p>
    </div>
  );
}
