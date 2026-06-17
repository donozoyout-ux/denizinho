import { Suspense } from "react";
import { Leaf } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

function LoginFormFallback() {
  return (
    <div className="flex justify-center py-12">
      <LoadingSpinner />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_30%),linear-gradient(135deg,_#2e7d32_0%,_#1f6b3a_55%,_#155e75_100%)] p-12">
        <div className="max-w-md text-white">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Leaf className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold">{APP_NAME}</h1>
          <p className="mt-4 text-lg text-white/80">
            {APP_TAGLINE}. Görevlerinizi, gruplarınızı ve bildirimlerinizi
            aynı yerden takip edin.
          </p>
          <div className="mt-8 flex gap-3">
            <div className="h-2 w-12 rounded-full bg-tider-orange" />
            <div className="h-2 w-12 rounded-full bg-white/40" />
            <div className="h-2 w-12 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-tider-green">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          </div>
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Giriş Yap
          </h2>
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
