"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, ShieldCheck } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  // Define navigation links
  // In a real app, you might filter these based on role (Admin vs Convenor)
  const routes = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: "/convenor", // Defaulting to convenor for now
      color: "text-sky-500",
    },
    {
      label: "My Events",
      icon: CalendarDays,
      href: "/convenor/events", // You can create this page later
      color: "text-violet-500",
    },
    {
      label: "Team",
      icon: Users,
      href: "/convenor/team",
      color: "text-pink-700",
    },
    {
      label: "Admin View",
      icon: ShieldCheck,
      href: "/admin", // For testing your admin role later
      color: "text-orange-700",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4">
             {/* Replace with your logo later */}
             <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold">
            Joseph<span className="text-purple-400">iesta</span>
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Footer / Logout */}
      <div className="px-3 py-2">
         <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-white/5">
             <LogOut className="h-5 w-5 mr-3" />
             Logout
         </Button>
      </div>
    </div>
  );
}