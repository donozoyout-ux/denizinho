"use client";

import { useState, useEffect } from "react";
import type { Task, TaskStatus, User, Project } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { toDatetimeLocalValue } from "@/lib/utils";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  teamMembers: User[];
  projects?: Project[];
  initialData?: Partial<Task>;
  title?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  assigned_to: string;
  status: TaskStatus;
  due_date: string;
  project_id?: string;
}

export function TaskFormModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  teamMembers,
  projects = [],
  initialData,
  title = "Yeni Görev Oluştur",
}: TaskFormModalProps) {
  const [form, setForm] = useState<TaskFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    assigned_to: initialData?.assigned_to || "",
    status: initialData?.status || "todo",
    due_date: toDatetimeLocalValue(initialData?.due_date ?? null) || "",
    project_id: initialData?.project_id || "",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      title: initialData?.title || "",
      description: initialData?.description || "",
      assigned_to: initialData?.assigned_to || "",
      status: initialData?.status || "todo",
      due_date: toDatetimeLocalValue(initialData?.due_date ?? null) || "",
      project_id: initialData?.project_id || "",
    });
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(form);
      onClose();
      setForm({
        title: "",
        description: "",
        assigned_to: "",
        status: "todo",
        due_date: "",
        project_id: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="title"
          label="Görev Adı"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Açıklama
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-tider-green focus:outline-none focus:ring-2 focus:ring-tider-green/20"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Görev detayları..."
          />
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              İlişkili Proje
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-tider-green focus:outline-none focus:ring-2 focus:ring-tider-green/20"
              value={form.project_id}
              onChange={(e) =>
                setForm({ ...form, project_id: e.target.value })
              }
            >
              <option value="">Projesiz (Genel Görev)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Atanan Kişi
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-tider-green focus:outline-none focus:ring-2 focus:ring-tider-green/20"
            value={form.assigned_to}
            onChange={(e) =>
              setForm({ ...form, assigned_to: e.target.value })
            }
          >
            <option value="">Seçiniz...</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name || member.email}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Durum
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-tider-green focus:outline-none focus:ring-2 focus:ring-tider-green/20"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as TaskStatus })
              }
            >
              <option value="todo">Yapılacaklar</option>
              <option value="in_progress">Devam Edenler</option>
              <option value="done">Tamamlananlar</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Son Tarih ve Saat
            </label>
            <input
              id="due_date"
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-tider-green focus:outline-none focus:ring-2 focus:ring-tider-green/20"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-between gap-3 pt-2">
          {onDelete && (
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={async () => {
                if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
                setDeleting(true);
                setError("");
                try {
                  await onDelete();
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Silinemedi");
                } finally {
                  setDeleting(false);
                }
              }}
            >
              Sil
            </Button>
          )}
          <div className="ml-auto flex gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" loading={loading}>
            Kaydet
          </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
