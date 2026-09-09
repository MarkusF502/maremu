// app/inicio/page.tsx  (ou onde estiver o DashboardPage)
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Flame, AlertCircle, Lightbulb, Receipt } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useDashboard } from "@/src/hooks/useDashboard";
import { CountUp } from "@/src/components/CountUp";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";

type AuthUser = { name?: string } | null;

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function dataDeHoje() {
  const label = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const RANK_COLORS = ['#1a3673', '#2563eb', '#6aa4f8'];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const authUser = user as AuthUser;
  const { data, loading: dashLoading, error } = useDashboard();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  if (authLoading || !user || dashLoading) {
    return (
      <div className="max-w-330 px-8.5 pb-13 pt-7.5">
        <div className="mm-skeleton h-5.5 w-58 rounded-lg" />
        <div className="mt-6.5 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(212px, 1fr))' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mm-skeleton h-29.5 rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1.85fr) minmax(0,1fr)' }}>
          <div className="mm-skeleton h-105 rounded-2xl" />
          <div className="flex flex-col gap-4">
            <div className="mm-skeleton h-32 rounded-2xl" />
            <div className="mm-skeleton h-32 rounded-2xl" style={{ animationDelay: '80ms' }} />
            <div className="mm-skeleton h-32 rounded-2xl" style={{ animationDelay: '160ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 mm-fade">
        {error || 'Erro ao carregar dados.'}
      </div>
    );
  }

  const { resumo_dia, tendencia_7dias, top_produtos_semana,
          alertas_estoque, ultimas_transacoes } = data;

  const ontem = tendencia_7dias.length >= 2 ? tendencia_7dias[tendencia_7dias.length - 2] : undefined;
  const variacao = ontem && ontem.faturamento > 0
    ? ((resumo_dia.faturamento - ontem.faturamento) / ontem.faturamento) * 100
    : null;
  const margem = resumo_dia.faturamento > 0
    ? (resumo_dia.lucro_bruto / resumo_dia.faturamento) * 100
    : null;

  const kpis: {
    label: string;
    raw: number;
    format: (v: number) => string;
    suffix?: string;
    valueColor: string;
    sub?: string;
    subColor?: string;
  }[] = [
    {
      label: 'Faturamento do dia', raw: resumo_dia.faturamento, format: brl, valueColor: '#0f172a',
      sub: variacao !== null ? `${variacao >= 0 ? '+' : ''}${variacao.toFixed(0)}% vs. ontem` : undefined,
      subColor: variacao !== null && variacao >= 0 ? '#10b981' : '#dc2626',
    },
    {
      label: 'Lucro estimado', raw: resumo_dia.lucro_bruto, format: brl, valueColor: '#047857',
      sub: margem !== null ? `margem de ${margem.toFixed(1).replace('.', ',')}%` : undefined,
      subColor: '#64748b',
    },
    { label: 'Ticket médio', raw: resumo_dia.ticket_medio, format: brl, valueColor: '#0f172a' },
    { label: 'Peças vendidas', raw: resumo_dia.pecas_vendidas, format: (v) => `${Math.round(v)}`, suffix: 'unidades', valueColor: '#0f172a' },
  ];

  // Insight automático baseado nos dados reais
  const melhorDia = [...tendencia_7dias].sort((a, b) => b.faturamento - a.faturamento)[0];
  const insightTexto = melhorDia?.faturamento > 0
    ? `O melhor dia da semana foi ${melhorDia.label} com ${brl(melhorDia.faturamento)} em faturamento.${
        top_produtos_semana[0]
          ? ` "${top_produtos_semana[0].nome}" lidera com ${top_produtos_semana[0].total_vendas} vendas.`
          : ''
      }`
    : 'Nenhuma venda registrada ainda esta semana. Cadastre suas vendas na tela Ponto de Venda.';

  const primeiroNome = authUser?.name?.split(' ')[0];

  return (
    <div className="max-w-330 px-8.5 pb-13 pt-7.5 mm-screen-in">

      <div className="mb-6 flex items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.09em] text-[#0080ff]">Resumo de hoje</p>
          <h1 className="mt-1.5 text-[29px] font-extrabold tracking-tight text-[#0f172a]">
            {saudacao()}{primeiroNome ? `, ${primeiroNome}` : ''}
          </h1>
          <p className="mt-1.5 text-sm text-[#64748b]">{dataDeHoje()}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/relatorio')}
          className="mm-hover flex h-10.5 shrink-0 items-center gap-2 rounded-[11px] bg-[#1a3673] px-5 text-sm font-bold text-white shadow-[0_8px_18px_-10px_rgba(26,54,115,0.75)] hover:-translate-y-px hover:bg-[#0080ff] active:translate-y-0 active:scale-[.985]"
        >
          Ver relatório da loja
          <ArrowRight size={17} strokeWidth={1.7} />
        </button>
      </div>

      <div className="mm-stagger grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(212px, 1fr))' }}>
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="mm-rise-in mm-hover rounded-2xl border border-[#e4eaf4] bg-white p-5.5 hover:-translate-y-0.75 hover:border-[#cfe0f8] hover:shadow-[0_16px_30px_-22px_rgba(15,23,42,0.5)]"
            style={{ '--mm-i': i } as React.CSSProperties}
          >
            <p className="text-[11.5px] font-bold uppercase tracking-[.07em] text-[#8494ad]">{kpi.label}</p>
            <p
              className="mt-3 whitespace-nowrap text-[clamp(21px,2vw,31px)] font-extrabold tracking-tight"
              style={{ color: kpi.valueColor, fontVariantNumeric: 'tabular-nums' }}
            >
              <CountUp to={kpi.raw} format={kpi.format} />
              {kpi.suffix && <span className="ml-1.5 text-[15px] font-semibold lowercase text-[#94a3b8]">{kpi.suffix}</span>}
            </p>
            {kpi.sub && <p className="mt-2 text-[12.5px] font-semibold" style={{ color: kpi.subColor }}>{kpi.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mm-stagger mt-4 grid items-start gap-4" style={{ gridTemplateColumns: 'minmax(0,1.85fr) minmax(0,1fr)' }}>

        {/* Tendência — gráfico real */}
        <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-6.5" style={{ '--mm-i': 1 } as React.CSSProperties}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[17px] font-bold text-[#0f172a]">Tendência de curto prazo</h2>
              <p className="mt-1 text-[13px] text-[#64748b]">Faturamento e lucro nos últimos 7 dias</p>
            </div>
            <div className="flex gap-3.5 text-xs font-semibold text-[#475569]">
              <span className="flex items-center gap-1.5"><i className="block h-2.25 w-2.25 rounded-[3px] bg-[#2563eb]" />Faturamento</span>
              <span className="flex items-center gap-1.5"><i className="block h-2.25 w-2.25 rounded-[3px] bg-[#10b981]" />Lucro</span>
            </div>
          </div>

          <div className="mt-6 h-64">
            {tendencia_7dias.every(d => d.faturamento === 0) ? (
              <div className="flex h-full items-center justify-center rounded-xl bg-[#f8fafd] text-sm text-[#94a3b8]">
                Nenhuma venda registrada nos últimos 7 dias.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendencia_7dias} barSize={18} barGap={5}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#a3b0c4', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      brl(Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0)),
                      name === 'faturamento' ? 'Faturamento' : 'Lucro',
                    ]}
                    labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="faturamento" fill="#2563eb" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="lucro" fill="#10b981" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3.5 rounded-[13px] border border-[#e2ebfa] bg-[#f5f8fe] px-4.75 py-4.25">
            <Lightbulb size={19} className="mt-px shrink-0 text-[#0080ff]" strokeWidth={1.6} />
            <p className="text-[13.5px] leading-relaxed text-[#334155]">
              <strong className="text-[#1a3673]">Insight:</strong> {insightTexto}
            </p>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-4">

          {/* Top 3 */}
          <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-5.5" style={{ '--mm-i': 2 } as React.CSSProperties}>
            <h3 className="mb-3.5 flex items-center gap-2 text-[14.5px] font-bold text-[#0f172a]">
              <Flame size={17} className="text-[#f59e0b]" strokeWidth={1.6} />
              Top 3 da semana
            </h3>
            {top_produtos_semana.length === 0 ? (
              <p className="rounded-[11px] bg-[#f8fafd] p-3 text-sm text-[#64748b]">Nenhuma venda registrada esta semana.</p>
            ) : (
              <div className="flex flex-col gap-2.25">
                {top_produtos_semana.slice(0, 3).map((p, i) => (
                  <div key={p.nome} className="mm-hover flex items-center gap-2.75 rounded-[11px] bg-[#f8fafd] px-3 py-2.5 hover:translate-x-0.75 hover:bg-[#f1f5fc]">
                    <span
                      className="flex h-5.25 w-5.25 shrink-0 items-center justify-center rounded-[7px] text-[11px] font-bold text-white"
                      style={{ background: RANK_COLORS[i] ?? '#94a3b8' }}
                    >
                      {i + 1}
                    </span>
                    <span className="truncate text-[13.5px] font-semibold text-[#1e293b]">{p.nome}</span>
                    <span className="ml-auto shrink-0 text-[11.5px] font-bold text-[#0080ff]">{p.total_vendas} vendas</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estoque crítico */}
          <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-5.5" style={{ '--mm-i': 3 } as React.CSSProperties}>
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[14.5px] font-bold text-[#0f172a]">
                <AlertCircle size={17} className="text-[#dc2626]" strokeWidth={1.6} />
                Estoque crítico
              </h3>
              {alertas_estoque.length > 0 && (
                <span className="rounded-full bg-[#fef2f2] px-2.25 py-0.75 text-[11px] font-bold text-[#dc2626]">
                  {alertas_estoque.length}
                </span>
              )}
            </div>
            {alertas_estoque.length === 0 ? (
              <p className="rounded-[11px] bg-[#eafaf1] p-3 text-sm text-[#047857]">Todos os estoques estão acima do mínimo.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {alertas_estoque.map((a, i) => {
                  const critico = a.quantidade_estoque <= 2;
                  return (
                    <div
                      key={`${a.produto_nome}-${a.tamanho}-${i}`}
                      onClick={() => router.push('/produtos')}
                      className={`mm-hover flex cursor-pointer items-center gap-2.5 rounded-[11px] border px-3 py-2.5 hover:translate-x-0.75 ${
                        critico ? 'border-[#fbe3e3] bg-[#fef5f5] hover:bg-[#fdeaea]' : 'border-[#fbe9cf] bg-[#fff9f0] hover:bg-[#fdf2e0]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`truncate text-[13px] font-bold ${critico ? 'text-[#9f1239]' : 'text-[#92400e]'}`}>{a.produto_nome}</p>
                        <p className={`mt-0.5 text-[11.5px] ${critico ? 'text-[#b45c68]' : 'text-[#b07724]'}`}>Tam. {a.tamanho}</p>
                      </div>
                      <span className={`ml-auto shrink-0 text-xs font-extrabold ${critico ? 'text-[#dc2626]' : 'text-[#d97706]'}`}>
                        {a.quantidade_estoque} un.
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Últimas transações */}
          <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-5.5" style={{ '--mm-i': 4 } as React.CSSProperties}>
            <h3 className="mb-3 flex items-center gap-2 text-[14.5px] font-bold text-[#0f172a]">
              <Receipt size={17} className="text-[#0080ff]" strokeWidth={1.6} />
              Últimas transações
            </h3>
            {ultimas_transacoes.length === 0 ? (
              <p className="rounded-[11px] bg-[#f8fafd] p-3 text-sm text-[#64748b]">Nenhuma transação registrada.</p>
            ) : (
              <div className="flex flex-col">
                {ultimas_transacoes.map((t, i) => (
                  <div
                    key={`${t.nome}-${i}`}
                    className={`flex items-center gap-2.5 py-2.5 ${i < ultimas_transacoes.length - 1 ? 'border-b border-[#f2f5fa]' : ''}`}
                  >
                    <span className="truncate text-[13px] font-semibold text-[#334155]">{t.nome}</span>
                    <span className="ml-auto shrink-0 text-xs text-[#94a3b8]">×{t.quantidade}</span>
                    <span className="shrink-0 text-[13px] font-bold text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {brl(t.preco_unitario_vendido * t.quantidade)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
