"use client"

import React, { useState } from "react"
import { Search, Plus, Image as ImageIcon } from "lucide-react"

type CartItem = {
  id: string
  nome: string
  variacao: string
  preco: string
}

export default function PDVPage() {
  const [busca, setBusca] = useState("")

  const [cartItems] = useState<CartItem[]>([
    { id: "1", nome: "Camisa Oxford", variacao: "Tamanho M | Azul", preco: "R$ 149,90" },
    { id: "2", nome: "Calça Cargo", variacao: "Tamanho 42 | Bege", preco: "R$ 189,90" },
    { id: "3", nome: "T-shirt Básica", variacao: "Tamanho P | Branca", preco: "R$ 59,90" },
  ])

  return (
    <div className="min-h-screen p-8 bg-[#bfdbfe]">
      <h1 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight">Fluxo de Venda</h1>

      {/* Container Principal do PDV */}
      <div className="max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* CARD ESQUERDO: Seleção de Produto */}
        <div className="lg:col-span-8 bg-[#1E3A8A] rounded-[32px] p-8 text-white flex flex-col">
          <h2 className="text-xl font-bold mb-4">Adicionar Produto</h2>
          
          {/* Input de Busca */}
          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
            <input 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar Produto por nome ou ID" 
              className="w-full bg-[#0F172A] rounded-xl py-4 pl-12 pr-4 text-white outline-none placeholder:text-white/40"
            />
          </div>

          {/* Divisão Interna: Variações e Preview */}
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Variações */}
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-4 text-white/90">Variação Selecionada</h3>
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-32 h-28 bg-[#0F172A] rounded-xl flex flex-col items-center justify-center text-white/50 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <Plus size={24} className="mb-2 text-white/30" />
                    <span className="text-[10px]">Tamanho, Cor, Unidade</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview do Produto */}
            <div className="w-full md:w-[280px] bg-[#0F172A] rounded-[24px] p-6 flex flex-col shadow-lg border border-white/5">
              <div className="w-full h-40 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                <ImageIcon className="text-white/20" size={56} />
              </div>
              <div className="flex flex-col flex-1">
                <h3 className="font-bold text-lg mb-1 leading-tight">Calça Cargo - Bege</h3>
                <p className="text-blue-200 font-semibold text-xl mb-6">R$ 189,90</p>
                
                <button className="mt-auto w-full bg-[#0080ff] hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors">
                  Adicionar Produto
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* CARD DIREITO: Carrinho e Checkout */}
        <div className="lg:col-span-4 bg-[#0F172A] rounded-[32px] p-8 text-white flex flex-col h-full min-h-[650px] shadow-2xl">
          <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Carrinho (03 itens)</h2>
          
          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {cartItems.map((item, idx) => (
              <div key={item.id} className={`flex justify-between items-center ${idx !== cartItems.length - 1 ? "border-b border-white/5 pb-4" : ""}`}>
                <div>
                  <p className="font-bold text-white/90">{item.nome}</p>
                  <p className="text-xs text-white/50 mt-1">{item.variacao}</p>
                </div>
                <p className="font-semibold text-white/90">{item.preco}</p>
              </div>
            ))}
          </div>

          {/* Resumo Financeiro e Ação Final */}
          <div className="pt-6 border-t border-white/10 mt-6 space-y-3 shrink-0">
            <div className="flex justify-between text-white/70 font-medium"><span>Subtotal</span><span>R$ 399,70</span></div>
            <div className="flex justify-between text-red-500 font-medium"><span>Desconto</span><span>- R$ 19,70</span></div>
            <div className="flex justify-between text-white items-end pt-4">
              <span className="text-lg font-bold tracking-wide">TOTAL</span>
              <span className="text-4xl font-bold">R$ 380,00</span>
            </div>
            
            <button className="w-full mt-8 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wide shadow-lg shadow-indigo-500/30">
              FINALIZAR VENDA (F2)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}