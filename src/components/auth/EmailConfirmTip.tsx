"use client";

export function EmailConfirmTip() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 leading-relaxed">
      <strong>İpucu:</strong> Kayıt sonrası giriş yapamıyorsanız e-posta doğrulaması
      gerekiyor olabilir. Gelen kutunuzdaki bağlantıya tıklayın. Geliştirme için
      Supabase → Authentication → Providers → Email → &quot;Confirm email&quot;
      seçeneğini kapatabilirsiniz.
    </p>
  );
}
