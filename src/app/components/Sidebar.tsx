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
import { clearToken } from "@/src/lib/auth-token";

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
      clearToken();
      router.push("/login");
    }
  };

  return (
    <aside className="flex h-full w-63 shrink-0 flex-col bg-white border-r border-[#e4eaf4]">
      <div className="flex items-center gap-2.5 px-5.5 pb-4.5 pt-6.5">
        <div className="relative h-6.5 w-26">
          <Image src="/logo.png" alt="Maremu" fill sizes="104px" className="object-contain object-left" priority />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3.5 py-2.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-[11px] px-3 py-2.75 text-sm font-semibold transition-colors duration-200 ${
                active ? "bg-[#eef4ff] text-[#1a3673]" : "text-[#475569] hover:bg-[#f1f5fc] hover:text-[#1a3673]"
              }`}
            >
              <Icon size={19} className="shrink-0" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-[#eef1f7] px-3.5 py-3">
        <Link
          href="/configuracoes"
          aria-current={pathname === "/configuracoes" ? "page" : undefined}
          className={`flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-[11px] px-3 py-2.75 text-sm font-semibold transition-colors duration-200 ${
            pathname === "/configuracoes" ? "bg-[#eef4ff] text-[#1a3673]" : "text-[#475569] hover:bg-[#f1f5fc] hover:text-[#1a3673]"
          }`}
        >
          <Settings size={19} className="shrink-0" strokeWidth={1.5} />
          Configurações
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.75 text-left text-sm font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50"
        >
          <LogOut size={19} className="shrink-0" strokeWidth={1.5} />
          Sair
        </button>
      </div>
    </aside>
  );
}
