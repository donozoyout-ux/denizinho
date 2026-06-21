"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Kanban, Folder, Users, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/board", label: "Tasks", icon: Kanban },
    { href: "/projects", label: "Projects", icon: Folder },
    { href: "/donors", label: "Donors", icon: HeartHandshake },
    { href: "/team", label: "Team", icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-gray-100 bg-white px-4 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] md:hidden">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center"
          >
            <div
              className={cn(
                "flex items-center gap-2 rounded-full py-2 px-4 transition-all duration-300",
                isActive
                  ? "bg-[#e8f5ec] text-[#1e6b34] font-semibold"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon className="h-5 w-5" />
              {isActive && (
                <span className="text-xs transition-opacity duration-300">
                  {item.label}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
