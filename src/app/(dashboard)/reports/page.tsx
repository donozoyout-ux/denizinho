import { Header } from "@/components/layout/Header";
import { 
  Users, 
  Truck, 
  DollarSign, 
  AlertTriangle, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown,
  Activity
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const stats = [
    {
      title: "Assisted Families",
      value: "24,592",
      change: "+12.5%",
      isPositive: true,
      icon: Users,
    },
    {
      title: "Supplies Delivered (Tons)",
      value: "1,840",
      change: "+8.2%",
      isPositive: true,
      icon: Truck,
    },
    {
      title: "Funds Disbursed",
      value: "$4.2M",
      change: "+4.1%",
      isPositive: true,
      icon: DollarSign,
    },
    {
      title: "Active Incidents",
      value: "14",
      change: "-2.4%",
      isPositive: false,
      icon: AlertTriangle,
    },
  ];

  const distributionData = [
    { month: "Jan", delivered: 120, target: 150 },
    { month: "Feb", delivered: 160, target: 150 },
    { month: "Mar", delivered: 220, target: 200 },
    { month: "Apr", delivered: 210, target: 200 },
    { month: "May", delivered: 180, target: 220 },
    { month: "Jun", delivered: 240, target: 220 },
    { month: "Jul", delivered: 280, target: 250 },
  ];

  const regionalImpact = [
    { name: "Sub-Saharan Africa", percentage: 45, color: "bg-emerald-600" },
    { name: "Middle East", percentage: 30, color: "bg-emerald-500" },
    { name: "South Asia", percentage: 15, color: "bg-emerald-400" },
    { name: "Other", percentage: 10, color: "bg-emerald-200" },
  ];

  const operations = [
    { code: "OP-AQU-092", region: "Horn of Africa", status: "Active", funds: "$1.2M", efficiency: "92%" },
    { code: "OP-FOD-110", region: "Sahel Region", status: "Active", funds: "$850K", efficiency: "88%" },
    { code: "OP-MED-204", region: "South Asia", status: "Pending", funds: "$300K", efficiency: "74%" },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Header
          title="Global Etki Özeti"
          description="Q3 2024 operasyonları için analitik ve raporlama."
        />
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <Download className="h-4 w-4" />
            PDF Raporunu İndir
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            Son 30 Gün
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{stat.title}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  stat.isPositive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "bg-orange-50 text-orange-700"
                }`}>
                  {stat.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-bold tracking-tight text-gray-900">{stat.value}</span>
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Aid Distribution Trend */}
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Yardım Dağıtım Trendi</h3>
              <p className="text-xs text-gray-500">Dağıtılan yardım hacmi vs hedef</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-3 w-3 rounded bg-emerald-600" />
                Dağıtılan (Ton)
              </span>
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-3 w-3 rounded bg-emerald-200" />
                Hedef (Ton)
              </span>
            </div>
          </div>
          
          {/* Custom SVG Bar Chart */}
          <div className="mt-6 flex h-64 items-end justify-between gap-4 px-2">
            {distributionData.map((data, idx) => {
              const maxVal = 300;
              const deliveredHeight = (data.delivered / maxVal) * 100;
              const targetHeight = (data.target / maxVal) * 100;

              return (
                <div key={idx} className="group flex flex-1 flex-col items-center gap-2 h-full justify-end">
                  <div className="relative w-full flex items-end justify-center gap-1.5 h-full pb-2 border-b border-gray-100">
                    {/* Target Bar */}
                    <div 
                      className="w-3 rounded-t bg-emerald-200 transition-all duration-500 group-hover:bg-emerald-300"
                      style={{ height: `${targetHeight}%` }}
                      title={`Hedef: ${data.target} Ton`}
                    />
                    {/* Delivered Bar */}
                    <div 
                      className="w-3 rounded-t bg-emerald-600 transition-all duration-500 group-hover:bg-emerald-700"
                      style={{ height: `${deliveredHeight}%` }}
                      title={`Dağıtılan: ${data.delivered} Ton`}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Regional Impact */}
        <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-50 pb-4">
            <h3 className="text-base font-bold text-gray-900">Bölgesel Etki</h3>
            <p className="text-xs text-gray-500">Bölgelere göre kaynak tahsisi</p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center">
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center h-44 w-44">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background track */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                
                {/* 45% Segment (Sub-Saharan Africa) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#059669" strokeWidth="3" 
                  strokeDasharray="45 100" strokeDashoffset="0" />
                
                {/* 30% Segment (Middle East) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3" 
                  strokeDasharray="30 100" strokeDashoffset="-45" />

                {/* 15% Segment (South Asia) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#34d399" strokeWidth="3" 
                  strokeDasharray="15 100" strokeDashoffset="-75" />

                {/* 10% Segment (Other) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#a7f3d0" strokeWidth="3" 
                  strokeDasharray="10 100" strokeDashoffset="-90" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-gray-900">55%</span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tamamlandı</span>
              </div>
            </div>

            {/* Legends */}
            <div className="mt-6 w-full space-y-2">
              {regionalImpact.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-gray-900">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Efficiency Section */}
      <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Son Operasyonel Verimlilik</h3>
            <p className="text-xs text-gray-500">Devam eden operasyonlar için performans metrikleri</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 cursor-pointer hover:underline">Tümünü Gör</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 rounded-l-lg">Operasyon Kodu</th>
                <th className="px-6 py-3">Bölge</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3">Kullanılan Fon</th>
                <th className="px-6 py-3 rounded-r-lg">Verimlilik Puanı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {operations.map((op, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{op.code}</td>
                  <td className="px-6 py-4">{op.region}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      op.status === "Active" 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        op.status === "Active" ? "bg-emerald-600" : "bg-amber-500"
                      }`} />
                      {op.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{op.funds}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    <div className="flex items-center gap-3">
                      <span className="w-8">{op.efficiency}</span>
                      <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                        <div 
                          className="h-full rounded-full bg-emerald-600" 
                          style={{ width: op.efficiency }} 
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
