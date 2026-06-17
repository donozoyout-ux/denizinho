"use client";

import { useState } from "react";
import type { Task, User } from "@/types/database";
import { isGroupAdmin } from "@/lib/auth-client";
import { TaskStatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface TaskTableProps {
  tasks: Task[];
  user: User;
}

type SortKey = "title" | "status" | "due_date" | "created_at";

export function TaskTable({ tasks, user }: TaskTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = tasks
    .filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee?.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="search"
            placeholder="Görev ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-4 py-3 font-medium text-gray-600">
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("title")}
                  >
                    Görev Adı
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Açıklama
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Atanan
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("status")}
                  >
                    Durum
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("due_date")}
                  >
                    Son Tarih
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort("created_at")}
                  >
                    Oluşturulma
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((task, i) => (
                <tr
                  key={task.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {task.title}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {task.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {task.assignee?.full_name || task.assignee?.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(task.due_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {formatDate(task.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">
            {search ? "Aramanızla eşleşen görev bulunamadı" : "Henüz görev yok"}
          </p>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Toplam {filtered.length} görev gösteriliyor
        {isGroupAdmin(user) && " (size atanan görevler)"}
      </p>
    </div>
  );
}
