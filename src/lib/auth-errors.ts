const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials":
    "E-posta veya şifre hatalı. Lütfen tekrar deneyin.",
  "Email not confirmed":
    "E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzdaki bağlantıya tıklayın veya aşağıdan tekrar gönderin.",
  "User already registered":
    "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.",
  "Signup requires a valid password":
    "Geçerli bir şifre girin (en az 6 karakter).",
  "Unable to validate email address: invalid format":
    "Geçersiz e-posta formatı.",
};

export function translateAuthError(message: string): string {
  return AUTH_ERROR_MAP[message] ?? message;
}

export const AUTH_PAGE_ERRORS: Record<string, string> = {
  auth: "Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.",
  oauth: "Google ile giriş tamamlanamadı. Supabase ve Google ayarlarını kontrol edin.",
  confirm: "E-posta doğrulaması başarısız. Bağlantı süresi dolmuş olabilir.",
};
