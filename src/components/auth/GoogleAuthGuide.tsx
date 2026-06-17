"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { APP_NAME } from "@/lib/config";

export function GoogleAuthGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700"
      >
        Google ile giriş nasıl ayarlanır?
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-600 space-y-3 leading-relaxed">
          <p className="font-medium text-gray-800">1. Google Cloud Console</p>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tider-green underline inline-flex items-center gap-1"
              >
                Google Cloud Credentials
                <ExternalLink className="h-3 w-3" />
              </a>
              {" "}sayfasına gidin
            </li>
            <li>Create Credentials → OAuth client ID → Web application</li>
            <li>
              Authorized redirect URI olarak şunu ekleyin:
              <code className="mt-1 block rounded bg-white px-2 py-1 text-[11px] break-all">
                https://jwasvclbwkkqodtbwiob.supabase.co/auth/v1/callback
              </code>
            </li>
            <li>Client ID ve Client Secret&apos;i kopyalayın</li>
          </ol>

          <p className="font-medium text-gray-800">2. Supabase Dashboard</p>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>
              <a
                href="https://supabase.com/dashboard/project/jwasvclbwkkqodtbwiob/auth/providers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tider-green underline inline-flex items-center gap-1"
              >
                Authentication → Providers → Google
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Google&apos;ı etkinleştirin, Client ID ve Secret yapıştırın</li>
            <li>
              URL Configuration&apos;da kullandığınız alan adlarını ekleyin:
              <code className="mt-1 block rounded bg-white px-2 py-1 text-[11px]">
                http://localhost:3000/auth/callback
              </code>
              <code className="mt-1 block rounded bg-white px-2 py-1 text-[11px] break-all">
                https://ekipplan-app.netlify.app/auth/callback
              </code>
            </li>
          </ol>

          <p className="text-gray-500">
            Google veya e-posta ile giris acilmiyorsa sorun genelde Supabase
            icindeki Redirect URL listesindedir. {APP_NAME} icin aktif site
            adresinizin callback yolu mutlaka tanimli olmalidir:
            {" "}
            <code className="rounded bg-white px-1">https://ekipplan-app.netlify.app/auth/callback</code>
          </p>
        </div>
      )}
    </div>
  );
}
