# TIDER Görev Yönetimi

Modern, hafif NGO görev yönetim uygulaması. TIDER.org kurumsal renklerinden ilham alınmıştır (yeşil, turuncu, beyaz/gri).

## Teknolojiler

- **Next.js 16** (App Router)
- **Tailwind CSS 4**
- **Supabase** (Auth + PostgreSQL)
- **@dnd-kit** (Kanban sürükle-bırak)
- **n8n** (AI görev çıkarma webhook)

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Ortam değişkenlerini ayarlayın

```bash
cp .env.local.example .env.local
```

`.env.local` dosyasını Supabase ve n8n bilgilerinizle doldurun.

### 3. Supabase veritabanını oluşturun

Supabase SQL Editor'da `supabase/schema.sql` dosyasını çalıştırın.

### 4. Supabase Auth ayarları

- **Email/Password**: Authentication → Providers → Email (etkin)
- **Google OAuth**: Authentication → Providers → Google (Client ID/Secret ekleyin)
- **Redirect URL**: `http://localhost:3000/auth/callback`

### 5. İlk Patron kullanıcısı

Kayıt olduktan sonra Supabase SQL Editor'da:

```sql
UPDATE public.users SET role = 'patron' WHERE email = 'your-email@example.com';
```

### 6. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Uygulama: [http://localhost:3000](http://localhost:3000)

## Netlify'a Deploy

### Yöntem 1: Netlify Dashboard (önerilen)

1. Kodu GitHub/GitLab'a push edin
2. [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**
3. Repoyu seçin — `netlify.toml` otomatik algılanır
4. **Site settings → Environment variables** bölümüne ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `N8N_WEBHOOK_URL` (opsiyonel)
5. **Deploy site** — birkaç dakika içinde canlı URL alırsınız

### Yöntem 2: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Supabase Redirect URL (Netlify için)

Supabase → Authentication → URL Configuration:

- **Site URL**: `https://your-site.netlify.app`
- **Redirect URLs**: `https://your-site.netlify.app/auth/callback`

### Ana Sayfa

- `/` — Herkese açık tanıtım sayfası (landing page)
- `/dashboard` — Giriş yapılmış kullanıcı paneli
- `/login` — Giriş
- `/signup` — Kayıt

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| **Patron** | Görev atama, düzenleme, onaylama, tüm paneller |
| **Ekip Üyesi** | Sadece kendine atanan görevleri görme ve "Tamamlandı" işaretleme |

## Ekranlar

- **Dashboard** — İstatistikler + gelen e-posta/talep taslakları
- **Görev Panosu** — Kanban (Yapılacaklar / Devam Edenler / Tamamlananlar)
- **Tablo Görünümü** — Excel benzeri tüm görev listesi
- **Excel Import** — AI destekli dosya/metin içe aktarma
- **Ekip Yönetimi** — Rol atama (Patron only)

## API Uç Noktaları

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/tasks` | GET, POST | Görev listeleme / oluşturma |
| `/api/tasks/[id]` | PATCH, DELETE | Görev güncelleme / silme |
| `/api/import` | POST | n8n AI dosya içe aktarma |
| `/api/incoming-requests` | GET, POST | Gelen talepler (n8n webhook) |
| `/api/incoming-requests/[id]/convert` | POST | Talebi göreve dönüştür |
| `/api/email/notify` | POST | E-posta bildirimi (placeholder) |
| `/api/team` | PATCH | Rol güncelleme |

## n8n Entegrasyonu

n8n webhook'unuz şu JSON formatında yanıt vermelidir:

```json
[
  {
    "gorev_adi": "Gıda paketi dağıtımı",
    "aciklama": "Cumartesi sabah 09:00",
    "ilgili_eposta": "gonullu@tider.org"
  }
]
```

`src/lib/n8n/import-tasks.ts` dosyasında production-ready fetch fonksiyonu bulunur.

## Proje Yapısı

```
src/
├── app/
│   ├── (dashboard)/     # Ana uygulama sayfaları
│   ├── api/             # API route'ları
│   ├── auth/            # OAuth callback
│   ├── login/           # Giriş
│   └── signup/          # Kayıt
├── components/
│   ├── auth/            # Login/Signup formları
│   ├── board/           # Kanban bileşenleri
│   ├── dashboard/       # Dashboard bileşenleri
│   ├── import/          # Dosya yükleme
│   ├── layout/          # Sidebar, Header
│   ├── table/           # Tablo görünümü
│   ├── tasks/           # Görev formları
│   ├── team/            # Ekip yönetimi
│   └── ui/              # Paylaşılan UI
├── lib/
│   ├── supabase/        # Supabase client'ları
│   ├── n8n/             # n8n webhook entegrasyonu
│   └── email/           # E-posta bildirimleri
└── types/
    └── database.ts      # TypeScript tipleri
```
