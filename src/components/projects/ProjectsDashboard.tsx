"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, ProjectStatus, Task, User } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { 
  FolderPlus, 
  Play, 
  CheckCircle, 
  RotateCcw, 
  Trash2, 
  Briefcase, 
  Calendar,
  Layers,
  ArrowRight
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
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("todo");
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");

  const isPatron = user.role === "patron";

  // Calculate project statistics (tasks completed vs total)
  const getProjectStats = (projectId: string) => {
    const projectTasks = allTasks.filter((t) => t.project_id === projectId);
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === "done").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  };

  // Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError("");
    setCreateLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Proje oluşturulamadı");

      setProjects([data, ...projects]);
      setTitle("");
      setDescription("");
      setStatus("todo");
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setCreateLoading(false);
    }
  };

  // Update Project Status
  const handleUpdateStatus = async (projectId: string, newStatus: ProjectStatus) => {
    setLoadingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Durum güncellenemedi");

      const updated = await res.json();
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updated : p))
      );
      router.refresh();
    } catch {
      alert("Proje durumu güncellenirken hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Bu projeyi silmek istediğinize emin misiniz? Projeye ait tüm görevler ilişkisiz kalacaktır.")) return;

    setLoadingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Proje silinemedi");

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      router.refresh();
    } catch {
      alert("Proje silinirken hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  };

  const columns: { id: ProjectStatus; label: string; color: string; bg: string }[] = [
    { 
      id: "todo", 
      label: "Planlanan / Yapılacaklar", 
      color: "text-gray-700 border-gray-200", 
      bg: "bg-gray-50/50" 
    },
    { 
      id: "in_progress", 
      label: "Devam Eden Projeler", 
      color: "text-orange-700 border-orange-200", 
      bg: "bg-orange-50/10" 
    },
    { 
      id: "done", 
      label: "Biten / Tamamlananlar", 
      color: "text-green-700 border-green-200", 
      bg: "bg-green-50/10" 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-tider-green" />
          <span className="text-sm font-medium text-gray-600">
            Toplam <strong>{projects.length}</strong> Proje tanımlı
          </span>
        </div>
        {isPatron && (
          <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4" />
            Yeni Proje Ekle
          </Button>
        )}
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {columns.map((col) => {
          const colProjects = projects.filter((p) => p.status === col.id);

          return (
            <div 
              key={col.id} 
              className={`flex flex-col rounded-2xl border border-gray-200 ${col.bg} p-4 min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className={`text-base font-semibold ${col.color.split(" ")[0]}`}>
                  {col.label}
                </h3>
                <span className="inline-flex items-center justify-center rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700 shadow-sm">
                  {colProjects.length}
                </span>
              </div>

              {/* Project Cards List */}
              <div className="flex-1 space-y-4 overflow-y-auto">
                {colProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-200 rounded-xl bg-white/50">
                    <Layers className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400 font-medium">Bu aşamada proje bulunmuyor</p>
                  </div>
                ) : (
                  colProjects.map((project) => {
                    const stats = getProjectStats(project.id);
                    const isLoading = loadingId === project.id;

                    return (
                      <div
                        key={project.id}
                        className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
                      >
                        <div>
                          {/* Title */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-gray-900 group-hover:text-tider-green transition-colors">
                              {project.title}
                            </h4>
                            {isPatron && (
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                disabled={isLoading}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1 rounded hover:bg-red-50"
                                title="Projeyi Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          {/* Description */}
                          <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {project.description || "Açıklama belirtilmemiş."}
                          </p>

                          {/* Progress Tracker */}
                          <div className="mt-4 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-gray-500">Görev İlerlemesi</span>
                              <span className="text-gray-900">{stats.completed}/{stats.total} (%{stats.percent})</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-tider-green transition-all duration-500"
                                style={{ width: `${stats.percent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between">
                          {/* Navigate to tasks */}
                          <button
                            onClick={() => router.push(`/board?project_id=${project.id}`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-tider-green hover:text-tider-green-dark"
                          >
                            Görevleri Gör
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>

                          {/* Status transition buttons (Patron only) */}
                          {isPatron && (
                            <div className="flex items-center gap-1">
                              {project.status === "todo" && (
                                <button
                                  disabled={isLoading}
                                  onClick={() => handleUpdateStatus(project.id, "in_progress")}
                                  className="inline-flex items-center gap-1 rounded bg-tider-green text-white px-2 py-1 text-xs font-medium hover:bg-tider-green-dark transition-colors"
                                  title="Projeyi Başlat"
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  Başlat
                                </button>
                              )}

                              {project.status === "in_progress" && (
                                <>
                                  <button
                                    disabled={isLoading}
                                    onClick={() => handleUpdateStatus(project.id, "todo")}
                                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                    title="Planlananlara Geri Al"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    disabled={isLoading}
                                    onClick={() => handleUpdateStatus(project.id, "done")}
                                    className="inline-flex items-center gap-1 rounded bg-green-600 text-white px-2 py-1 text-xs font-medium hover:bg-green-700 transition-colors"
                                    title="Projeyi Tamamla"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    Tamamla
                                  </button>
                                </>
                              )}

                              {project.status === "done" && (
                                <button
                                  disabled={isLoading}
                                  onClick={() => handleUpdateStatus(project.id, "in_progress")}
                                  className="inline-flex items-center gap-1 rounded border border-gray-200 text-gray-600 px-2 py-1 text-xs font-medium hover:bg-gray-50 transition-colors"
                                  title="Devam Edene Geri Al"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Geri Al
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yeni Proje Ekle">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            id="projTitle"
            label="Proje Adı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Biyoloji Dersi Materyalleri"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Proje Açıklaması
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-tider-green focus:outline-none focus:ring-2 focus:ring-tider-green/20"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Projenin amacı, kapsamı ve hedefleri..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Başlangıç Durumu
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-tider-green focus:outline-none focus:ring-2 focus:ring-tider-green/20"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              <option value="todo">Planlanan / Yapılacak</option>
              <option value="in_progress">Devam Eden</option>
              <option value="done">Tamamlanan / Biten</option>
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit" loading={createLoading}>
              Oluştur
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
