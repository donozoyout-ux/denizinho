"use client";

import { useState } from "react";
import { Mail, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmailIntegrationGuide() {
  const [copied, setCopied] = useState<string | null>(null);
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://your-site.netlify.app";

  const webhookUrl = `${appUrl}/api/webhook/email`;
  const importWebhook = `${appUrl}/api/import`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-xl border border-tider-green/20 bg-tider-green-light/30 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Mail className="h-5 w-5 text-tider-green" />
        <h3 className="text-lg font-semibold text-gray-900">
          E-posta Tarama & Bildirim Kurulumu (n8n)
        </h3>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">
        Google hesabınızı n8n&apos;e bağlayın. Gelen mailler otomatik taranır,
        görevler çıkarılır ve listeye eklenir. Görev atandığında üyelere mail gider.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">
            1. Gelen e-posta webhook (n8n → bu uygulama)
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white px-3 py-2 text-xs break-all border">
              {webhookUrl}
            </code>
            <Button size="sm" variant="outline" onClick={() => copy(webhookUrl, "email")}>
              {copied === "email" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">
            2. n8n workflow adımları
          </p>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside ml-1">
            <li>Gmail Trigger — patron mailini bağla</li>
            <li>AI node — mailden görevleri çıkar</li>
            <li>HTTP Request POST → yukarıdaki webhook URL</li>
            <li>Header: <code>x-api-key: INCOMING_WEBHOOK_API_KEY</code></li>
            <li>Body: <code>{`{ "subject": "...", "body": "...", "from": "...", "tasks": [...] }`}</code></li>
          </ol>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">
            3. Görev bildirimi webhook (uygulama → n8n → mail gönder)
          </p>
          <p className="text-xs text-gray-500">
            Netlify env&apos;e <code>N8N_EMAIL_WEBHOOK_URL</code> ekleyin — görev atanınca bu adrese POST gider, n8n maili gönderir.
          </p>
        </div>

        <a
          href="https://n8n.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-tider-green font-medium hover:underline"
        >
          n8n.io&apos;da workflow oluştur
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
