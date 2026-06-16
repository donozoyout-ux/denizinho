import { Suspense } from "react";
import { Leaf } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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
      <div className="hidden lg:flex lg:w-1/2 bg-tider-green items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Leaf className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold">TIDER Görev Yönetimi</h1>
          <p className="mt-4 text-lg text-white/80">
            Ekip lideriniz için görev kaosunu ortadan kaldıran modern ve
            hafif yönetim aracı.
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
            <h1 className="text-2xl font-bold text-gray-900">TIDER Görev</h1>
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
