import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Shirt,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Settings,
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 h-full bg-gray-100 border-r border-gray-200 flex flex-col text-slate-700 shrink-0">
      <div className="p-6">
        <div className="relative w-40 h-10">
          <Image 
            src="/logo.png" 
            alt="Logo Maremu" 
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-200 text-[#1a3673] font-medium transition-colors">
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link href="/produtos" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
          <Shirt size={20} />
          Produtos
        </Link>
        <Link href="/relatorio" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
          <BarChart3 size={20} />
          Relatório
        </Link>
        <Link href="/produtos/novo" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
          <TrendingUp size={20} />
          Cadastrar Produto
        </Link>
        <Link href="/pdv" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
          <TrendingDown size={20} />
          Ponto de Venda
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <Link href="/configuracoes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
          <Settings size={20} />
          Configurações
        </Link>
      </div>
    </aside>
  );
}