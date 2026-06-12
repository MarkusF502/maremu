"use client"

import React from "react"
import Link from "next/link"
import { ChevronDown, Plus } from "lucide-react"

type ProductStatus = "Em Estoque" | "Estoque Baixo" | "Crítico"

interface Product {
  id: string
  nome: string
  categoria: string
  estoque: number
  precoVenda: string
  lucroReal: string
  status: ProductStatus
}

const mockProducts: Product[] = [
  { id: "1", nome: "Camisa Social Premium", categoria: "Camisas", estoque: 45, precoVenda: "R$ 149,90", lucroReal: "R$ 55,00", status: "Em Estoque" },
  { id: "2", nome: "Jaqueta Jeans Trucker", categoria: "Casacos", estoque: 12, precoVenda: "R$ 199,90", lucroReal: "R$ 70,00", status: "Estoque Baixo" },
  { id: "3", nome: "Calça Cargo Slim", categoria: "Calças", estoque: 28, precoVenda: "R$ 169,90", lucroReal: "R$ 60,00", status: "Em Estoque" },
  { id: "4", nome: "Calça Jeans Skinny (T.40)", categoria: "Calças", estoque: 1, precoVenda: "R$ 139,90", lucroReal: "R$ 45,00", status: "Crítico" },
  { id: "5", nome: "T-shirt Básica Algodão", categoria: "Camisetas", estoque: 105, precoVenda: "R$ 59,90", lucroReal: "R$ 20,00", status: "Em Estoque" },
  { id: "6", nome: "Vestido Midi Floral", categoria: "Vestidos", estoque: 15, precoVenda: "R$ 189,90", lucroReal: "R$ 65,00", status: "Estoque Baixo" },
  { id: "7", nome: "Bermuda Sarja Masculina", categoria: "Bermudas", estoque: 50, precoVenda: "R$ 99,90", lucroReal: "R$ 35,00", status: "Em Estoque" },
]

export default function ProdutosPage() {
  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case "Em Estoque":
        return <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">Em Estoque</span>
      case "Estoque Baixo":
        return <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">Estoque Baixo</span>
      case "Crítico":
        return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">Crítico</span>
    }
  }

  return (
    <div className="min-h-screen p-8 bg-[#bfdbfe]">
      {/* Card Principal */}
      <div className="bg-[#1E3A8A] rounded-[32px] p-8 max-w-[1200px] mx-auto">
        
        {/* Cabeçalho Interno */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6 tracking-tight">Inventário de Peças</h1>
          
          {/* Barra de Controles */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            <div className="bg-[#0F172A] rounded-xl px-5 py-3 flex items-center gap-6 text-white">
              <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <span className="font-semibold text-sm">Filtros</span>
                <ChevronDown size={16} />
              </button>
              
              <div className="w-[1px] h-5 bg-white/20" />
              
              <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <span className="font-semibold text-sm">Edição Múltipla</span>
                <ChevronDown size={16} />
              </button>
            </div>

            <Link 
              href="/produtos/novo"
              className="bg-[#0080ff] hover:bg-blue-500 transition-colors text-white font-bold rounded-xl px-6 py-3 flex items-center gap-2"
            >
              <Plus size={20} />
              Novo Produto
            </Link>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-[#0F172A] rounded-3xl p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-4 px-4 text-white/70 text-sm font-semibold">Produto</th>
                <th className="pb-4 px-4 text-white/70 text-sm font-semibold">Categoria</th>
                <th className="pb-4 px-4 text-white/70 text-sm font-semibold">Estoque (Un)</th>
                <th className="pb-4 px-4 text-white/70 text-sm font-semibold">Preço Venda</th>
                <th className="pb-4 px-4 text-white/70 text-sm font-semibold">Lucro Real</th>
                <th className="pb-4 px-4 text-white/70 text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockProducts.map((product, index) => (
                <tr 
                  key={product.id} 
                  className={`hover:bg-white/5 transition-colors ${
                    index !== mockProducts.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <td className="py-4 px-4 text-white/90">{product.nome}</td>
                  <td className="py-4 px-4 text-white/90">{product.categoria}</td>
                  <td className="py-4 px-4 text-white/90">{product.estoque}</td>
                  <td className="py-4 px-4 text-white/90">{product.precoVenda}</td>
                  <td className="py-4 px-4 text-emerald-400 font-semibold">{product.lucroReal}</td>
                  <td className="py-4 px-4">{getStatusBadge(product.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}