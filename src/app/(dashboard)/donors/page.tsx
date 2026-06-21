"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { 
  HeartHandshake, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Filter, 
  DollarSign, 
  Gift, 
  Truck, 
  Layers, 
  UserCheck, 
  Calendar,
  X,
  Target,
  Trophy,
  ArrowRight
} from "lucide-react";
import type { Donor, Donation } from "@/lib/donors-store";

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tümü" | "Aktif" | "Pasif">("Tümü");
  
  // Modals state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // New Donor Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"Bireysel" | "Kurumsal">("Bireysel");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"Aktif" | "Pasif">("Aktif");
  
  // Initial Donation (during creation)
  const [hasInitialDonation, setHasInitialDonation] = useState(false);
  const [donationType, setDonationType] = useState<"Para" | "Ürün" | "Hizmet" | "Diğer">("Para");
  const [donationAmount, setDonationAmount] = useState("");
  const [donationDetails, setDonationDetails] = useState("");
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Add Donation Form (inside details modal)
  const [newDonationType, setNewDonationType] = useState<"Para" | "Ürün" | "Hizmet" | "Diğer">("Para");
  const [newDonationAmount, setNewDonationAmount] = useState("");
  const [newDonationDetails, setNewDonationDetails] = useState("");
  const [newDonationDate, setNewDonationDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/donors");
      if (!res.ok) throw new Error("Bağışçılar yüklenemedi");
      const data = await res.json();
      setDonors(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const payload: any = {
        name,
        type,
        email,
        phone,
        address,
        status,
      };

      if (hasInitialDonation && donationDetails.trim()) {
        payload.donation = {
          type: donationType,
          amount: Number(donationAmount) || 0,
          details: donationDetails,
          date: donationDate,
        };
      }

      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Bağışçı oluşturulurken hata oluştu");
      
      await fetchDonors();
      setCreateModalOpen(false);
      resetCreateForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonor || !newDonationDetails.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/donors/${selectedDonor.id}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newDonationType,
          amount: Number(newDonationAmount) || 0,
          details: newDonationDetails,
          date: newDonationDate,
        }),
      });

      if (!res.ok) throw new Error("Bağış kaydedilemedi");
      
      const addedDonation = await res.json();
      
      // Update local state dynamically
      const updatedDonor = {
        ...selectedDonor,
        donations: [addedDonation, ...selectedDonor.donations],
        total_donated: selectedDonor.total_donated + (Number(newDonationAmount) || 0),
        last_contact: newDonationDate
      };
      
      setSelectedDonor(updatedDonor);
      setDonors(prev => prev.map(d => d.id === selectedDonor.id ? updatedDonor : d));
      
      // Reset donation sub-form
      setNewDonationAmount("");
      setNewDonationDetails("");
      setNewDonationDate(new Date().toISOString().split("T")[0]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setName("");
    setType("Bireysel");
    setEmail("");
    setPhone("");
    setAddress("");
    setStatus("Aktif");
    setHasInitialDonation(false);
    setDonationType("Para");
    setDonationAmount("");
    setDonationDetails("");
    setDonationDate(new Date().toISOString().split("T")[0]);
  };

  // Filter logic
  const filteredDonors = donors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (d.address && d.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "Tümü" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Analytics helper calculations
  const totalDonorsCount = donors.length;
  const activeDonorsCount = donors.filter(d => d.status === "Aktif").length;
  
  // Total cash donations this month (mock calculations matching standard dashboard goals)
  const totalDonationValue = donors.reduce((sum, d) => sum + d.total_donated, 0);
  const monthlyGoal = 400000;
  const currentMonthDonation = 342500; // Mock from screenshot
  const monthlyProgressPercent = Math.min(100, Math.round((currentMonthDonation / monthlyGoal) * 100));

  // Get Top Supporters
  const topSupporters = [...donors]
    .sort((a, b) => b.total_donated - a.total_donated)
    .slice(0, 3);

  // Helper for donation icons
  const getDonationIcon = (type: string) => {
    switch (type) {
      case "Para": return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case "Ürün": return <Gift className="h-4 w-4 text-amber-600" />;
      case "Hizmet": return <Truck className="h-4 w-4 text-blue-600" />;
      default: return <Layers className="h-4 w-4 text-slate-600" />;
    }
  };

  const getDonationBadgeStyle = (type: string) => {
    switch (type) {
      case "Para": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Ürün": return "bg-amber-50 text-amber-700 border-amber-100";
      case "Hizmet": return "bg-blue-50 text-blue-700 border-blue-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Header
          title="Bağışçılar"
          description="Bağışçı ve destekçi veritabanını yönetin."
        />
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition"
          >
            <Plus className="h-4.5 w-4.5" />
            Yeni Bağışçı Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left/Middle Column - Main Donors Registry */}
        <div className="space-y-6 lg:col-span-2">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Bağışçı Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500">Durum:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 focus:border-emerald-600 focus:outline-none"
              >
                <option value="Tümü">Tümü</option>
                <option value="Aktif">Aktif</option>
                <option value="Pasif">Pasif</option>
              </select>
            </div>
          </div>

          {/* Donors Table Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Bağışçı Listesi</h3>
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {filteredDonors.length} Kayıt
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-800 border-t-transparent" />
              </div>
            ) : filteredDonors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <HeartHandshake className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm font-semibold text-gray-500">Bağışçı kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Ad-Soyad / Kurum</th>
                      <th className="px-6 py-4">Tip</th>
                      <th className="px-6 py-4 text-right">Top. Bağış</th>
                      <th className="px-6 py-4 text-center">Durum</th>
                      <th className="px-6 py-4">Son İletişim</th>
                      <th className="px-6 py-4 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDonors.map((donor) => (
                      <tr key={donor.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-800 text-xs">
                              {donor.name.charAt(0)}
                            </span>
                            <div>
                              <span className="block text-sm font-bold text-gray-900">{donor.name}</span>
                              <span className="block text-xs font-medium text-gray-400">{donor.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {donor.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-gray-900">
                          ₺{donor.total_donated.toLocaleString("tr-TR")}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            donor.status === "Aktif" 
                              ? "bg-emerald-50 text-emerald-700" 
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                              donor.status === "Aktif" ? "bg-emerald-500" : "bg-gray-400"
                            }`} />
                            {donor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          {donor.last_contact ? new Date(donor.last_contact).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedDonor(donor);
                                setDetailModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition"
                              title="Bağışçı Detayları ve Geçmişi"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Side Panel Analytics */}
        <div className="space-y-6">
          {/* Card: Total Donors */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">Toplam Bağışçı</span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                {totalDonorsCount.toLocaleString("tr-TR")}
              </span>
              <p className="text-xs text-gray-400 mt-1 font-semibold">
                {activeDonorsCount} aktif destekçi
              </p>
            </div>
          </div>

          {/* Card: Monthly Target Progress */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">Bu Ayki Bağış</span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                  ₺{currentMonthDonation.toLocaleString("tr-TR")}
                </span>
                <span className="text-xs text-gray-400 ml-1 font-semibold">
                  / ₺{monthlyGoal.toLocaleString("tr-TR")}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-emerald-800 transition-all duration-500"
                    style={{ width: `${monthlyProgressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>Aylık Hedef İlerlemesi</span>
                  <span>%{monthlyProgressPercent}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Top Supporters */}
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Trophy className="h-4.5 w-4.5 text-amber-500" />
                En Büyük Destekçiler
              </h3>
            </div>
            
            <div className="space-y-4">
              {topSupporters.map((supporter, index) => (
                <div key={supporter.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-400 w-4">#{index + 1}</span>
                    <span className="font-bold text-slate-800 truncate max-w-[120px]">{supporter.name}</span>
                  </div>
                  <span className="font-extrabold text-emerald-800">
                    ₺{supporter.total_donated.toLocaleString("tr-TR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Add New Donor */}
      <Modal 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        title="Yeni Bağışçı Ekle" 
        size="md"
      >
        <form onSubmit={handleCreateDonor} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Adı / Kurum Adı</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                placeholder="Örn: Ahmet Yılmaz veya TechNova A.Ş."
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Bağışçı Tipi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="Bireysel">Bireysel</option>
                <option value="Kurumsal">Kurumsal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                placeholder="ad@ornek.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                placeholder="+90 555..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Adres</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              placeholder="Şehir, Ülke veya Tam Adres"
            />
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="initial-donation-checkbox"
                checked={hasInitialDonation}
                onChange={(e) => setHasInitialDonation(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-gray-200 text-emerald-800 focus:ring-emerald-800"
              />
              <label htmlFor="initial-donation-checkbox" className="text-sm font-bold text-slate-700 cursor-pointer">
                İlk Bağış Kaydını Şimdi Ekle
              </label>
            </div>

            {hasInitialDonation && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Bağış Türü</label>
                    <select
                      value={donationType}
                      onChange={(e) => setDonationType(e.target.value as any)}
                      className="w-full rounded-xl border border-gray-200 bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="Para">Para (Nakdi)</option>
                      <option value="Ürün">Ürün (Gıda, Giyim, Ekipman vb.)</option>
                      <option value="Hizmet">Hizmet Desteği</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Eşdeğer Tutar (₺)</label>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Bağış Tarihi</label>
                    <input
                      type="date"
                      value={donationDate}
                      onChange={(e) => setDonationDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Detaylar / Açıklama</label>
                  <textarea
                    required={hasInitialDonation}
                    rows={2}
                    value={donationDetails}
                    onChange={(e) => setDonationDetails(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="Örn: 100 Kutu Kuru Gıda Paketi veya ₺15,000 Banka Havalesi"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={submitting}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-800 hover:bg-emerald-950 font-bold"
            >
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Donor Details and Donation Management */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedDonor ? `${selectedDonor.name} - Bağış Detayları` : "Bağışçı Bilgileri"}
        size="lg"
      >
        {selectedDonor && (
          <div className="space-y-6">
            {/* Donor Personal Stats Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50 text-xs">
              <div>
                <span className="block font-bold text-slate-400 uppercase tracking-wide">Bağışçı Tipi</span>
                <span className="block font-semibold text-slate-800 text-sm mt-0.5">{selectedDonor.type}</span>
              </div>
              <div>
                <span className="block font-bold text-slate-400 uppercase tracking-wide">E-posta</span>
                <span className="block font-semibold text-slate-800 text-sm mt-0.5 truncate">{selectedDonor.email || "-"}</span>
              </div>
              <div>
                <span className="block font-bold text-slate-400 uppercase tracking-wide">Telefon</span>
                <span className="block font-semibold text-slate-800 text-sm mt-0.5">{selectedDonor.phone || "-"}</span>
              </div>
              <div>
                <span className="block font-bold text-slate-400 uppercase tracking-wide">Toplam Destek</span>
                <span className="block font-extrabold text-emerald-800 text-sm mt-0.5">₺{selectedDonor.total_donated.toLocaleString("tr-TR")}</span>
              </div>
            </div>

            {/* Donation Add Form (Horizontal UI) */}
            <div className="border border-gray-200/80 p-4 rounded-2xl bg-white shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Yeni Bağış Kaydı Ekle</h4>
              
              <form onSubmit={handleAddDonation} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Bağış Türü</label>
                  <select
                    value={newDonationType}
                    onChange={(e) => setNewDonationType(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Para">Para (Nakdi)</option>
                    <option value="Ürün">Ürün</option>
                    <option value="Hizmet">Hizmet Desteği</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Eşdeğer Tutar (₺)</label>
                  <input
                    type="number"
                    value={newDonationAmount}
                    onChange={(e) => setNewDonationAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Açıklama / Ürün Detayları</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newDonationDetails}
                      onChange={(e) => setNewDonationDetails(e.target.value)}
                      placeholder="Örn: 20 Çuval Un, ₺5000 Nakit vb."
                      className="flex-1 rounded-xl border border-gray-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <Button 
                      type="submit"
                      disabled={submitting}
                      className="bg-emerald-800 hover:bg-emerald-950 font-bold px-4 py-2 shrink-0 h-9 rounded-xl text-xs text-white"
                    >
                      {submitting ? "Eklenti..." : "Ekle"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Donation History Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bağış Geçmişi</h4>
              
              <div className="overflow-hidden border border-gray-100 rounded-xl bg-white">
                {selectedDonor.donations.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-400 italic">Kayıtlı bağış bulunmamaktadır.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 font-bold text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Tür</th>
                        <th className="px-4 py-3">Açıklama / Ürün Detayları</th>
                        <th className="px-4 py-3 text-right">Tutar (₺)</th>
                        <th className="px-4 py-3">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {selectedDonor.donations.map((donation) => (
                        <tr key={donation.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full font-bold ${getDonationBadgeStyle(donation.type)}`}>
                              {getDonationIcon(donation.type)}
                              {donation.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{donation.details}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {donation.amount > 0 ? `₺${donation.amount.toLocaleString("tr-TR")}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-medium">
                            {new Date(donation.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Kapat
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
