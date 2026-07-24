// app/inicio/page.tsx  (ou onde estiver o DashboardPage)
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flame, AlertCircle, DollarSign, Lightbulb, Loader2 } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useDashboard } from "@/src/hooks/useDashboard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { data, loading: dashLoading, error } = useDashboard();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  if (authLoading || !user || dashLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        {error || 'Erro ao carregar dados.'}
      </div>
    );
  }

  const { resumo_dia, tendencia_7dias, top_produtos_semana,
          alertas_estoque, ultimas_transacoes } = data;

  // Insight automático baseado nos dados reais
  const melhorDia = [...tendencia_7dias].sort((a, b) => b.faturamento - a.faturamento)[0];
  const insightTexto = melhorDia?.faturamento > 0
    ? `O melhor dia da semana foi ${melhorDia.label} com ${brl(melhorDia.faturamento)} em faturamento.${
        top_produtos_semana[0]
          ? ` "${top_produtos_semana[0].nome}" lidera com ${top_produtos_semana[0].total_vendas} vendas.`
          : ''
      }`
    : 'Nenhuma venda registrada ainda esta semana. Cadastre suas vendas na tela Ponto de Venda.';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">

      {/* Resumo do dia */}
      <section className="w-full bg-[#1a3673] rounded-2xl p-8 text-white shadow-sm">
        <h2 className="text-2xl font-bold text-center mb-8">Resumo de Hoje</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: 'Faturamento do Dia',    value: brl(resumo_dia.faturamento) },
            { label: 'Lucro Estimado de Hoje',value: brl(resumo_dia.lucro_bruto), green: true },
            { label: 'Ticket Médio',           value: brl(resumo_dia.ticket_medio) },
            { label: 'Peças Vendidas Hoje',
              value: `${resumo_dia.pecas_vendidas}`,
              suffix: 'unidades' },
          ].map(({ label, value, green, suffix }) => (
            <div key={label} className="bg-white/10 p-5 rounded-xl border border-white/5">
              <p className="text-blue-200 text-sm font-medium mb-2 uppercase tracking-wide">
                {label}
              </p>
              <p className={`text-3xl font-bold ${green ? 'text-emerald-400' : ''}`}>
                {value}
                {suffix && (
                  <span className="text-lg font-normal text-blue-200 ml-2 lowercase">
                    {suffix}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Coluna esquerda — gráfico real */}
        <div className="bg-white rounded-2xl p-8 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-1">Tendência de Curto Prazo</h3>
          <p className="text-slate-500 text-sm mb-6">
            Faturamento e lucro nos últimos 7 dias.
          </p>

          <div className="h-64 mb-6">
            {tendencia_7dias.every(d => d.faturamento === 0) ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl">
                Nenhuma venda registrada nos últimos 7 dias.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendencia_7dias} barSize={28}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      brl(Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0)),
                      name === 'faturamento' ? 'Faturamento' : 'Lucro',
                    ]}
                    labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Legend
                    formatter={name => name === 'faturamento' ? 'Faturamento' : 'Lucro'}
                  />
                  <Bar dataKey="faturamento" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="lucro"       fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-[#1a3673] text-white p-5 rounded-xl mb-6 flex items-start gap-4">
            <Lightbulb className="text-yellow-400 shrink-0 mt-0.5" size={24} />
            <p className="text-sm leading-relaxed text-blue-50">
              <strong className="text-white">Insight: </strong>
              {insightTexto}
            </p>
          </div>

          <button
            onClick={() => router.push('/relatorio')}
            className="bg-[#0080ff] hover:bg-blue-600 transition-colors text-white px-6 py-3.5 rounded-xl font-semibold w-max shadow-sm"
          >
            Ver Relatório da Loja
          </button>
        </div>

        {/* Coluna direita — métricas secundárias */}
        <div className="bg-[#6aa4f8] rounded-2xl p-8 shadow-sm text-white flex flex-col gap-8">

          {/* Top 3 */}
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Flame size={22} className="text-orange-200" />
              Top 3 da Semana
            </h3>
            {top_produtos_semana.length === 0 ? (
              <p className="text-sm bg-white/10 p-5 rounded-xl text-white/70">
                Nenhuma venda registrada esta semana.
              </p>
            ) : (
              <ul className="space-y-3 text-sm bg-white/10 p-5 rounded-xl border border-white/20">
                {top_produtos_semana.map((p, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span className="font-medium truncate pr-2">{p.nome}</span>
                    <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold shrink-0">
                      {p.total_vendas} vendas
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Alertas */}
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <AlertCircle size={22} className="text-red-200" />
              Estoque Crítico
            </h3>
            {alertas_estoque.length === 0 ? (
              <p className="text-sm bg-green-500/20 p-5 rounded-xl text-white/80">
                Todos os estoques estão acima do mínimo.
              </p>
            ) : (
              <ul className="space-y-2">
                {alertas_estoque.map((a, i) => (
                  <li key={i} className="bg-red-500/80 text-white p-3 rounded-xl text-sm">
                    <strong>{a.produto_nome}</strong> — Tam. {a.tamanho}:{' '}
                    <strong>{a.quantidade_estoque} un.</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Últimas transações */}
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <DollarSign size={22} className="text-green-200" />
              Últimas Transações
            </h3>
            {ultimas_transacoes.length === 0 ? (
              <p className="text-sm bg-white/10 p-5 rounded-xl text-white/70">
                Nenhuma transação registrada.
              </p>
            ) : (
              <ul className="space-y-3 text-sm bg-white/10 p-5 rounded-xl border border-white/20">
                {ultimas_transacoes.map((t, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span className="truncate pr-4 font-medium">{t.nome}</span>
                    <span className="font-bold shrink-0">×{t.quantidade}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}