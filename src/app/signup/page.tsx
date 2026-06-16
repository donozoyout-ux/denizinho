import { Leaf } from "lucide-react";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-tider-orange items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Leaf className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold">Ekibe Katılın</h1>
          <p className="mt-4 text-lg text-white/80">
            TIDER gönüllü ve ekip üyeleri için görev takip platformu.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-tider-orange">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TIDER Görev</h1>
          </div>
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Kayıt Ol
          </h2>
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
