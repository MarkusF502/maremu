"use client"; // Obrigatório adicionar isso no topo para usar hooks!

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flame, AlertCircle, DollarSign, Lightbulb } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth"; // Ajuste o caminho se necessário

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // A REGRA DE PROTEÇÃO: Se terminou de carregar e NÃO tem usuário, chuta pro login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Enquanto a API checa se o usuário existe, mostramos uma tela limpa
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500 font-medium">Carregando painel...</p>
      </div>
    );
  }

  // Se chegou aqui, o usuário está logado! Mostramos o seu Dashboard:
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      {/* Sessão Superior: Banner "Resumo Rápido" */}
      <section className="w-full bg-[#1a3673] rounded-2xl p-8 text-white shadow-sm">
        <h2 className="text-2xl font-bold text-center mb-8">Resumo Rápido</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white/10 p-5 rounded-xl border border-white/5">
            <p className="text-blue-200 text-sm font-medium mb-2 uppercase tracking-wide">Faturamento do Dia</p>
            <p className="text-3xl font-bold">R$ 1.050,57</p>
          </div>
          
          <div className="bg-white/10 p-5 rounded-xl border border-white/5">
            <p className="text-blue-200 text-sm font-medium mb-2 uppercase tracking-wide">Lucro Estimado de Hoje</p>
            <p className="text-3xl font-bold text-emerald-400">R$ 305,57</p>
          </div>
          
          <div className="bg-white/10 p-5 rounded-xl border border-white/5">
            <p className="text-blue-200 text-sm font-medium mb-2 uppercase tracking-wide">Ticket Médio</p>
            <p className="text-3xl font-bold">R$ 119,90</p>
          </div>
          
          <div className="bg-white/10 p-5 rounded-xl border border-white/5">
            <p className="text-blue-200 text-sm font-medium mb-2 uppercase tracking-wide">Peças Vendidas Hoje</p>
            <p className="text-3xl font-bold">35 <span className="text-lg font-normal text-blue-200 lowercase">unidades</span></p>
          </div>
        </div>
      </section>

      {/* Sessão Inferior: Layout de Duas Colunas */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Tendência de Curto Prazo */}
        <div className="bg-white rounded-2xl p-8 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Tendência de Curto Prazo</h3>
          <p className="text-slate-500 text-sm mb-6">Visualize a relação entre faturamento bruto e lucro real nos últimos 7 dias.</p>
          
          {/* Placeholder do Gráfico */}
          <div className="h-64 bg-[#171b26] rounded-xl mb-6 relative overflow-hidden flex items-end p-4 border border-slate-100 shadow-inner">
            {/* Simulando as linhas de fundo do gráfico */}
            <div className="absolute inset-0 grid grid-cols-7 grid-rows-4 opacity-10 pointer-events-none">
              {[...Array(28)].map((_, i) => (
                <div key={i} className="border-b border-l border-white/20"></div>
              ))}
            </div>
            {/* Barras de mock simulando dados do gráfico */}
            <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-around px-6 pb-4 opacity-90 pt-8">
               <div className="w-10 bg-[#0080ff] h-[30%] rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer"></div>
               <div className="w-10 bg-[#0080ff] h-[45%] rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer"></div>
               <div className="w-10 bg-[#0080ff] h-[25%] rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer"></div>
               <div className="w-10 bg-[#0080ff] h-[60%] rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer"></div>
               <div className="w-10 bg-[#0080ff] h-[55%] rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer"></div>
               <div className="w-10 bg-[#0080ff] h-[80%] rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer"></div>
               <div className="w-10 bg-[#0080ff] h-[100%] rounded-t-sm shadow-[0_0_15px_rgba(0,128,255,0.5)] cursor-pointer"></div>
            </div>
          </div>

          {/* Card de Insight */}
          <div className="bg-[#1a3673] text-white p-5 rounded-xl mb-6 flex items-start gap-4">
             <Lightbulb className="text-yellow-400 shrink-0 mt-0.5" size={24} />
             <p className="text-sm leading-relaxed text-blue-50">
               <strong className="text-white">Insight do Dia:</strong> O lucro líquido subiu 12% em comparação a ontem. As vendas da peça "Camisa Social" alavancaram o ticket médio neste período.
             </p>
          </div>

          <button className="bg-[#0080ff] hover:bg-blue-600 transition-colors text-white px-6 py-3.5 rounded-xl font-semibold w-max shadow-sm">
            Ver Relatório da Loja
          </button>
        </div>

        {/* Coluna Direita: Métricas Secundárias */}
        <div className="bg-[#6aa4f8] rounded-2xl p-8 shadow-sm text-white flex flex-col gap-8 lg:col-span-1">
          
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Flame size={22} className="text-orange-200" /> Top 3 Mais Vendidos na Semana</h3>
            <ul className="space-y-3 text-sm bg-white/10 p-5 rounded-xl border border-white/20 shadow-sm">
              <li className="flex justify-between items-center"><span className="font-medium">Camisa Social</span> <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">103 vendas</span></li>
              <li className="flex justify-between items-center"><span className="font-medium">Jaqueta Jeans</span> <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">98 vendas</span></li>
              <li className="flex justify-between items-center"><span className="font-medium">Calça Cargo</span> <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">87 vendas</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><AlertCircle size={22} className="text-red-200" /> Alerta de Estoque Crítico</h3>
            <p className="bg-red-500/80 text-white p-5 rounded-xl text-sm shadow-sm leading-relaxed"><strong>Atenção:</strong> Calça Jeans Skinny - Tamanho 40 com apenas <strong>1 unidade</strong> restante no estoque.</p>
          </div>

          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><DollarSign size={22} className="text-green-200" /> Últimas Transações</h3>
            <ul className="space-y-3 text-sm bg-white/10 p-5 rounded-xl border border-white/20 shadow-sm">
              <li className="flex justify-between items-center opacity-90"><span className="truncate pr-4">Camisa Social</span> <span className="font-bold">x3</span></li>
              <li className="flex justify-between items-center opacity-90"><span className="truncate pr-4">Bermuda Sarja</span> <span className="font-bold">x1</span></li>
              <li className="flex justify-between items-center opacity-90"><span className="truncate pr-4">Tênis Casual Branco</span> <span className="font-bold">x1</span></li>
            </ul>
          </div>

        </div>
      </section>
    </div>
  );
}