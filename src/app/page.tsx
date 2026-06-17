import type { Metadata } from "next";
import Link from "next/link";
import {
  Leaf,
  Kanban,
  Bell,
  Upload,
  Mail,
  Shield,
  ArrowRight,
  CheckCircle2,
  Users,
  Sparkles,
  Layers3,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

const features = [
  {
    icon: Kanban,
    title: "Görev Panosu",
    description:
      "Yapılacaklar, Devam Edenler ve Tamamlananlar — sürükle-bırak Kanban ile görevleri yönetin.",
    color: "bg-tider-green-light text-tider-green",
  },
  {
    icon: Layers3,
    title: "Çoklu Grup Yönetimi",
    description:
      "Birden fazla ekip kurun, aktif grubunuzu değiştirin ve üyeleri ayrı ayrı yönetin.",
    color: "bg-gray-100 text-gray-600",
  },
  {
    icon: Upload,
    title: "AI Dosya İçe Aktarma",
    description:
      "Excel veya CSV yükleyin — AI otomatik olarak görevleri çıkarsın.",
    color: "bg-tider-orange-light text-tider-orange",
  },
  {
    icon: Bell,
    title: "Kalıcı Bildirimler",
    description:
      "Davetler ve güncellemeler uygulama içinde saklanır; kaçırılan işlem kalmaz.",
    color: "bg-tider-orange-light text-tider-orange",
  },
  {
    icon: Shield,
    title: "Rol Tabanlı Erişim",
    description:
      "Patron tüm görevleri yönetir; ekip üyeleri yalnızca kendi görevlerini görür.",
    color: "bg-tider-green-light text-tider-green",
  },
  {
    icon: Users,
    title: "Ekip Yönetimi",
    description:
      "Gönüllü ve personel rollerini merkezi panelden kolayca yönetin.",
    color: "bg-gray-100 text-gray-600",
  },
];

const steps = [
  "Kayıt olun veya giriş yapın",
  "Patron görevleri atar veya AI ile içe aktarır",
  "Ekip üyeleri görevlerini tamamlar",
  "Patron tüm süreci tek panelden takip eder",
];

export const metadata: Metadata = {
  title: `${APP_NAME} — Ekip ve Görev Yönetimi`,
  description:
    `${APP_NAME} ile ekipler, görevler, projeler ve bildirimler tek panelde yönetilir.`,
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(210,245,223,0.9),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,229,200,0.7),_transparent_28%),linear-gradient(180deg,_#f8fbf8_0%,_#ffffff_45%,_#f7fafc_100%)]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tider-green">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">{APP_NAME}</span>
              <span className="hidden sm:inline text-sm text-gray-400 ml-2">
                {APP_TAGLINE}
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Giriş Yap
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-tider-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-tider-green-dark"
            >
              Kayıt Ol
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-tider-green-light/40 via-white to-tider-orange-light/30" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-tider-green-light px-4 py-1.5 text-sm font-medium text-tider-green-dark">
                <Sparkles className="h-4 w-4" />
                Modern ekip yönetimi
              </div>
              <h1 className="text-4xl font-bold leading-tight text-gray-900 lg:text-5xl">
                Ekipleri, görevleri ve
                <span className="text-tider-green"> projeleri</span> tek yerden
                <span className="text-tider-orange"> yönetin</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                {APP_NAME}, ekip kurma, görev dağıtma, davet gönderme, proje
                takibi ve bildirim yönetimini tek ekranda toplayan modern bir
                çalışma alanıdır. Patronlar ve ekip üyeleri aynı akışta, daha
                net ve daha hızlı ilerler.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Kanban panosu ve görev detay ekranları",
                  "Çoklu grup ve üye yönetimi",
                  "Proje, alt proje ve alt görev desteği",
                  "Uygulama içi bildirim ve davet akışı",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl bg-white/80 px-4 py-3 text-sm text-gray-700 shadow-sm ring-1 ring-gray-100"
                  >
                    <CheckCircle2 className="h-4 w-4 text-tider-green" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-tider-green px-6 py-3 text-base font-semibold text-white shadow-lg shadow-tider-green/20 transition-all hover:bg-tider-green-dark hover:shadow-xl"
                >
                  Panele Git
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition-all hover:border-tider-orange hover:text-tider-orange"
                >
                  Ücretsiz Başla
                </Link>
              </div>
            </div>

            {/* Dashboard preview mockup */}
            <div className="relative">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-200/50">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs text-gray-400">{APP_NAME} Paneli</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Yapılacaklar", count: 5, color: "border-t-gray-300" },
                    { label: "Devam Edenler", count: 3, color: "border-t-tider-orange" },
                    { label: "Tamamlananlar", count: 12, color: "border-t-tider-green" },
                  ].map((col) => (
                    <div
                      key={col.label}
                      className={`rounded-xl border border-gray-100 bg-gray-50/80 border-t-4 ${col.color} p-3`}
                    >
                      <p className="text-xs font-semibold text-gray-600">{col.label}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{col.count}</p>
                      <div className="mt-3 space-y-2">
                        <div className="h-8 rounded-lg bg-white shadow-sm" />
                        <div className="h-8 rounded-lg bg-white shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl bg-tider-orange px-4 py-2 text-sm font-semibold text-white shadow-lg">
                + Bildirimler
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Neler sunuyoruz?</h2>
          <p className="mt-3 text-gray-500">
            Günlük operasyon için gereken temel araçlar tek panelde
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Nasıl çalışır?
              </h2>
              <p className="mt-3 text-gray-500">
                Dakikalar içinde ekibinizi kurup kullanmaya başlayın
              </p>
              <ul className="mt-8 space-y-4">
                {steps.map((step, i) => (
                  <li key={step} className="flex items-center gap-4">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-tider-green text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-tider-green p-8 text-white">
              <h3 className="text-xl font-bold">{APP_NAME} kimler için?</h3>
              <p className="mt-3 text-white/80 leading-relaxed">
                Küçük ekiplerden büyüyen organizasyonlara kadar herkes için
                sade ama güçlü bir çalışma alanı sunar. Görevler kaybolmaz,
                sorumluluklar görünür olur ve ekip aynı ekrandan ilerler.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Görev atama ve onaylama",
                  "Kanban görünümü ve detay takibi",
                  "Çoklu grup ve davet yönetimi",
                  "Uygulama içi bildirimler",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-tider-orange" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Hemen başlayın
        </h2>
        <p className="mt-3 text-gray-500">
          Hesabınızı oluşturun, grubunuzu kurun ve ekibinizle hemen çalışmaya başlayın
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-tider-orange px-8 py-3 text-base font-semibold text-white shadow-lg shadow-tider-orange/20 transition-all hover:bg-orange-600"
          >
            Kayıt Ol
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-8 py-3 text-base font-semibold text-gray-700 transition-all hover:bg-gray-50"
          >
            Giriş Yap
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tider-green">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {APP_NAME} © {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {APP_TAGLINE}
          </p>
        </div>
      </footer>
    </div>
  );
}
