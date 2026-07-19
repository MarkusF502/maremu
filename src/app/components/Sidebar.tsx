"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Shirt,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/inicio", icon: LayoutDashboard },
  { label: "Produtos", href: "/produtos", icon: Shirt },
  { label: "Relatório", href: "/relatorio", icon: BarChart3 },
  { label: "Cadastrar Produto", href: "/produtos/novo", icon: TrendingUp },
  { label: "Ponto de Venda", href: "/pdv", icon: TrendingDown },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      router.push("/login");
    }
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-100 text-slate-700">
      <div className="p-6">
        <div className="relative h-10 w-40">
          <Image src="/logo.png" alt="Logo Maremu" fill className="object-contain object-left" priority />
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${active ? "bg-gray-200 text-[#1a3673]" : "hover:bg-gray-200 hover:text-[#1a3673]"}`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-gray-200 p-4">
        <Link
          href="/configuracoes"
          aria-current={pathname === "/configuracoes" ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${pathname === "/configuracoes" ? "bg-gray-200 text-[#1a3673]" : "hover:bg-gray-200 hover:text-[#1a3673]"}`}
        >
          <Settings size={20} />
          Configurações
        </Link>
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-red-600 transition-colors hover:bg-red-50">
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
}
