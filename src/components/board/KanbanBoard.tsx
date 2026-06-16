"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Task, TaskStatus, User, UserRole, Project } from "@/types/database";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import {
  TaskFormModal,
  type TaskFormData,
} from "@/components/tasks/TaskFormModal";
import { Button } from "@/components/ui/Button";
import { Plus, ListFilter } from "lucide-react";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

interface KanbanBoardProps {
  initialTasks: Task[];
  userRole: UserRole;
  currentUserId: string;
  teamMembers: User[];
  projects: Project[];
}

export function KanbanBoard({
  initialTasks,
  userRole,
  currentUserId,
  teamMembers,
  projects,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load project filter from query param or default to "all"
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("project_id") || "all";
    }
    return "all";
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Filter tasks based on active project
  const filteredTasks = tasks.filter((t) => {
    if (activeProjectId === "all") return true;
    return t.project_id === activeProjectId;
  });

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status);

  const canMoveToStatus = (
    task: Task,
    newStatus: TaskStatus
  ): boolean => {
    if (userRole === "patron") return true;
    if (task.assigned_to !== currentUserId) return false;
    return newStatus === "done";
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Güncelleme başarısız");
    }

    return res.json();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;
    if (!COLUMNS.includes(newStatus)) return;
    if (!canMoveToStatus(task, newStatus)) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: task.status } : t
        )
      );
    }
  };

  const handleCreateTask = async (data: TaskFormData) => {
    // Inject active project ID if filtered and none is selected
    const postData = {
      ...data,
      project_id: data.project_id || (activeProjectId !== "all" ? activeProjectId : null)
    };

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Görev oluşturulamadı");
    }

    const newTask = await res.json();
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleEditTask = async (data: TaskFormData) => {
    if (!editingTask) return;

    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Güncelleme başarısız");
    }

    const updated = await res.json();
    setTasks((prev) =>
      prev.map((t) => (t.id === editingTask.id ? updated : t))
    );
    setEditingTask(null);
  };

  return (
    <div>
      {/* Dynamic Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-600">Proje Filtrele:</span>
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-tider-green focus:outline-none focus:ring-1 focus:ring-tider-green"
          >
            <option value="all">Tüm Görevler (Genel)</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.title}
              </option>
            ))}
          </select>
        </div>
        {userRole === "patron" && (
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Yeni Görev
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              userRole={userRole}
              currentUserId={currentUserId}
              onEditTask={userRole === "patron" ? setEditingTask : undefined}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 opacity-90">
              <TaskCard
                task={activeTask}
                userRole={userRole}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
        teamMembers={teamMembers}
        projects={projects}
      />

      {editingTask && (
        <TaskFormModal
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEditTask}
          teamMembers={teamMembers}
          projects={projects}
          initialData={editingTask}
          title="Görevi Düzenle"
        />
      )}
    </div>
  );
}
