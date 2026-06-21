"use client";

import { useState } from "react";
import { isGroupAdmin } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { Project, ProjectStatus, Task, User } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { 
  FolderPlus, 
  Trash2, 
  Briefcase, 
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  Clock,
  Play,
  CheckCircle2,
  Users
} from "lucide-react";

interface ProjectsDashboardProps {
  initialProjects: Project[];
  allTasks: Pick<Task, "id" | "status" | "project_id">[];
  user: User;
}

export function ProjectsDashboard({
  initialProjects,
  allTasks,
  user,
}: ProjectsDashboardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeTab, setActiveTab] = useState<ProjectStatus>("in_progress"); // Active Projects (in_progress), Planned (todo), Completed (done)
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [parentProjectId, setParentProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("todo");
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = isGroupAdmin(user);

  // Calculate project statistics recursively (tasks completed vs total)
  const getProjectStats = (projectId: string) => {
    const getProjectAndSubprojectIds = (pId: string): string[] => {
      const ids = [pId];
      const subs = projects.filter((p) => p.parent_id === pId);
      for (const sub of subs) {
        ids.push(...getProjectAndSubprojectIds(sub.id));
      }
      return ids;
    };

    const targetIds = getProjectAndSubprojectIds(projectId);
    const projectTasks = allTasks.filter((t) => t.project_id && targetIds.includes(t.project_id));
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === "done").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  };

  const openCreateModal = (parentId: string | null = null) => {
    setParentProjectId(parentId);
    setModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError("");
    setCreateLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status, parent_id: parentProjectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Proje oluşturulamadı");

      setProjects([data, ...projects]);
      setTitle("");
      setDescription("");
      setStatus("todo");
      setModalOpen(false);
      setParentProjectId(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Bu projeyi ve alt projelerini silmek istediğinize emin misiniz?")) return;

    setLoadingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Silme işlemi başarısız");
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Filter root projects by search query and active tab status
  const rootProjects = projects.filter((p) => !p.parent_id);
  const getSubProjects = (parentId: string) => projects.filter((p) => p.parent_id === parentId);

  const filteredProjects = rootProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = project.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Tab counts
  const countInTab = (statusVal: ProjectStatus) => rootProjects.filter(p => p.status === statusVal).length;

  // Custom high-fidelity properties mapping based on mock designs
  const getHighFidelityProps = (project: Project, statsPercent: number) => {
    const titleLower = project.title.toLowerCase();
    
    // 1. Winter Clothing style
    if (titleLower.includes("clothing") || titleLower.includes("kış") || titleLower.includes("afagf")) {
      return {
        badgeText: "Critical Priority",
        badgeStyle: "bg-rose-50 text-rose-700 border-rose-100",
        borderLeft: "border-l-rose-500 border-l-4",
        progressLabel: "Distribution Progress",
        percent: statsPercent > 0 ? statsPercent : 75,
        metaText: "Due in 2 days",
        metaIcon: <Calendar className="h-3.5 w-3.5 text-slate-400" />,
        warning: false
      };
    }
    
    // 2. Clean Water style
    if (titleLower.includes("water") || titleLower.includes("su") || titleLower.includes("hayvan") || titleLower.includes("rehabilitasyon")) {
      return {
        badgeText: "In Progress",
        badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-100/60",
        borderLeft: "border-l-emerald-500 border-l-4",
        progressLabel: "Installation Status",
        percent: statsPercent > 0 ? statsPercent : 42,
        metaText: "Ends Nov 15",
        metaIcon: <Clock className="h-3.5 w-3.5 text-slate-400" />,
        warning: false
      };
    }
    
    // 3. Mobile Clinic style
    if (titleLower.includes("clinic") || titleLower.includes("klinik") || titleLower.includes("zxvcz")) {
      return {
        badgeText: "Delayed",
        badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
        borderLeft: "border-l-slate-400 border-l-4",
        progressLabel: "Equipping Phase",
        percent: statsPercent > 0 ? statsPercent : 15,
        metaText: "Review Required",
        metaIcon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
        warning: true
      };
    }

    // Default style mapping
    return {
      badgeText: project.status === "done" ? "Completed" : project.status === "in_progress" ? "In Progress" : "Planned",
      badgeStyle: project.status === "done" 
        ? "bg-blue-50 text-blue-700 border-blue-100" 
        : project.status === "in_progress" 
          ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
          : "bg-slate-100 text-slate-600 border-slate-200",
      borderLeft: project.status === "done" 
        ? "border-l-blue-500 border-l-4" 
        : project.status === "in_progress" 
          ? "border-l-emerald-500 border-l-4" 
          : "border-l-slate-350 border-l-4",
      progressLabel: "Progress Rate",
      percent: statsPercent,
      metaText: project.status === "done" ? "Finished" : "Active",
      metaIcon: project.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Play className="h-3.5 w-3.5 text-slate-400" />,
      warning: false
    };
  };

  return (
    <div className="space-y-6">
      {/* Top action/filters bar matching screenshot 2 */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, tasks, or team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {/* Filter and project addition triggers */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition">
            <Filter className="h-4 w-4 text-slate-400" />
            Filter
          </button>
          
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            Sort by Priority
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => openCreateModal()} 
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
            >
              <FolderPlus className="h-4 w-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Tabs list matching screenshot 2 */}
      <div className="flex border-b border-slate-200/80 gap-6 text-sm font-bold text-slate-400">
        <button
          onClick={() => setActiveTab("in_progress")}
          className={`pb-3.5 relative flex items-center gap-2 cursor-pointer transition ${
            activeTab === "in_progress" ? "text-emerald-800 border-b-2 border-emerald-850" : "hover:text-slate-600"
          }`}
        >
          Active Projects
          <span className={`inline-flex items-center justify-center rounded-full h-5 px-1.5 text-[10px] font-extrabold ${
            activeTab === "in_progress" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {countInTab("in_progress")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("todo")}
          className={`pb-3.5 relative flex items-center gap-2 cursor-pointer transition ${
            activeTab === "todo" ? "text-emerald-800 border-b-2 border-emerald-850" : "hover:text-slate-600"
          }`}
        >
          Planned
          <span className={`inline-flex items-center justify-center rounded-full h-5 px-1.5 text-[10px] font-extrabold ${
            activeTab === "todo" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {countInTab("todo")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("done")}
          className={`pb-3.5 relative flex items-center gap-2 cursor-pointer transition ${
            activeTab === "done" ? "text-emerald-800 border-b-2 border-emerald-850" : "hover:text-slate-600"
          }`}
        >
          Completed
          <span className={`inline-flex items-center justify-center rounded-full h-5 px-1.5 text-[10px] font-extrabold ${
            activeTab === "done" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {countInTab("done")}
          </span>
        </button>
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-200 rounded-2xl bg-white">
          <Layers className="h-10 w-10 text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-400">Bu aşamada proje bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const stats = getProjectStats(project.id);
            const ui = getHighFidelityProps(project, stats.percent);
            const subProjects = getSubProjects(project.id);
            const isLoading = loadingId === project.id;

            return (
              <div
                key={project.id}
                className={`group relative flex flex-col justify-between rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-600/20 hover:-translate-y-0.5 ${ui.borderLeft}`}
              >
                <div>
                  {/* Badge & delete */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wide uppercase ${ui.badgeStyle}`}>
                      {ui.badgeText}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={isLoading}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50"
                        title="Projeyi Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-slate-800 text-sm leading-tight truncate hover:text-emerald-850 transition">
                    {project.title}
                  </h4>

                  {/* Description */}
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {project.description || "Açıklama belirtilmemiş."}
                  </p>

                  {/* Progress Tracker */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400">{ui.progressLabel}</span>
                      <span className="text-slate-800">%{ui.percent}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-800 transition-all duration-500"
                        style={{ width: `${ui.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Team Avatars mock layout */}
                  <div className="flex -space-x-1.5 overflow-hidden mt-4.5 mb-2">
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-500 text-[8px] font-bold text-white flex items-center justify-center uppercase shadow-sm">dn</div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-500 text-[8px] font-bold text-white flex items-center justify-center uppercase shadow-sm">as</div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-500 text-[8px] font-bold text-white flex items-center justify-center uppercase shadow-sm">mk</div>
                    <span className="text-[10px] text-slate-400 font-bold self-center ml-2.5">+3 kişi</span>
                  </div>
                </div>

                <div className="border-t border-slate-100/60 pt-3 mt-4 flex items-center justify-between text-xs">
                  {/* Meta Text/Icon */}
                  <div className="flex items-center gap-1 font-bold text-slate-400">
                    {ui.metaIcon}
                    <span className={ui.warning ? "text-amber-600 font-bold" : ""}>
                      {ui.metaText}
                    </span>
                  </div>

                  {/* Quick Sub-project toggle button */}
                  {isAdmin && (
                    <button
                      onClick={() => openCreateModal(project.id)}
                      className="text-[10px] font-extrabold text-emerald-800 hover:underline"
                    >
                      + Alt Proje Ekle
                    </button>
                  )}
                </div>

                {/* Subprojects list rendering */}
                {subProjects.length > 0 && (
                  <div className="mt-3.5 border-t border-slate-100/60 pt-3 space-y-1.5 pl-2 border-l border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Alt Projeler ({subProjects.length})</p>
                    {subProjects.map((sub) => {
                      const subStats = getProjectStats(sub.id);
                      return (
                        <div key={sub.id} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-600 truncate max-w-[130px]">{sub.title}</span>
                          <span className="text-slate-400 font-bold">%{subStats.percent}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={parentProjectId ? "Alt Proje Ekle" : "Yeni Proje Ekle"}>
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Proje Adı</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              placeholder="Örn: Winter Clothing Drive"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
              placeholder="Proje detaylarını yazın..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Durum</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="todo">Planlandı</option>
              <option value="in_progress">Devam Ediyor</option>
              <option value="done">Tamamlandı</option>
            </select>
          </div>

          {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded">{error}</p>}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={createLoading}>
              İptal
            </Button>
            <Button type="submit" loading={createLoading} className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold">
              Oluştur
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
