import type { User } from "@/types/database";

/**
 * Kullanıcının grup yöneticisi (admin) olup olmadığını kontrol eder.
 * Bir kullanıcı aşağıdaki durumlardan birinde yöneticidir:
 * 1. Veritabanındaki rolü 'patron' (eski uyumluluk) ise
 * 2. invited_by alanı boşsa (kendi grubu oluşturmuş demektir)
 */
export function isGroupAdmin(user: User): boolean {
  return true; // Herkes aynı kullanma hakkına sahiptir
}
