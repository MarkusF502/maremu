"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { apiFetch } from "@/src/lib/api";
import { CountUp } from "@/src/components/CountUp";

type Resumo = {
  liquidez_estoque: number;
  total_unidades_estoque: number;
  lucro_medio_peca: number;
  upt: number;
  ticket_medio: number;
  total_pedidos: number;
  fonte_lucro_categoria: "vendas_realizadas" | "estoque_potencial";
};

type AlertaCritico = {
  produto: string;
  tamanho: string;
  quantidade: number;
  estoque_minimo: number;
  mensagem: string;
};

type ItemCurvaAbc = {
  produto: string;
  categoria: string;
  valor_estoque: number;
  percentual: number;
  percentual_acumulado: number;
  classe: "A" | "B" | "C";
};

type ProdutoLucro = {
  produto: string;
  categoria: string;
  custo: number;
  venda: number;
  lucro_unitario: number;
  margem_percentual: number;
  estoque: number;
};

type EstoqueCategoria = {
  categoria: string;
  quantidade: number;
  percentual: number;
};

type LucroCategoria = {
  categoria: string;
  lucro: number;
  percentual: number;
};

type RelatorioResponse = {
  resumo: Resumo;
  alertas_criticos: AlertaCritico[];
  curva_abc: ItemCurvaAbc[];
  produtos_maior_lucro: ProdutoLucro[];
  estoque_por_categoria: EstoqueCategoria[];
  lucro_por_categoria: LucroCategoria[];
};

const CORES_CATEGORIAS = ["#1a3673", "#0080ff", "#6aa4f8", "#10b981", "#c3d4ea", "#f59e0b", "#a855f7", "#64748b"];
const CLASSE_COR: Record<ItemCurvaAbc["classe"], string> = { A: "#1a3673", B: "#2563eb", C: "#c3d4ea" };

function formatCurrency(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0);
}

function truncateLabel(label: string, max = 14) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function ParetoChart({ itens }: { itens: ItemCurvaAbc[] }) {
  if (itens.length === 0) {
    return <EmptyState texto="Cadastre produtos com preço e estoque para gerar a Curva ABC." />;
  }

  const largura = 720;
  const altura = 260;
  const margem = { top: 16, right: 44, bottom: 56, left: 68 };
  const areaLargura = largura - margem.left - margem.right;
  const areaAltura = altura - margem.top - margem.bottom;
  const maiorValor = Math.max(...itens.map((item) => item.valor_estoque), 1);
  const maxValor = maiorValor * 1.12;
  const passo = areaLargura / itens.length;
  const larguraBarra = Math.min(passo * 0.62, 40);
  const pontos = itens
    .map((item, index) => {
      const x = margem.left + passo * index + passo / 2;
      const y = margem.top + areaAltura - (item.percentual_acumulado / 100) * areaAltura;
      return `${x},${y}`;
    })
    .join(" ");

  const ticksValor = [0, 0.25, 0.5, 0.75, 1].map((fator) => maxValor * fator);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="h-auto min-w-140 w-full"
        role="img"
        aria-label="Curva ABC calculada com o valor real do estoque"
      >
        {ticksValor.map((valor) => {
          const y = margem.top + areaAltura - (valor / maxValor) * areaAltura;
          return (
            <g key={valor}>
              <line x1={margem.left} x2={largura - margem.right} y1={y} y2={y} stroke="#f1f4fa" strokeWidth="1" />
              <text x={margem.left - 10} y={y + 4} textAnchor="end" fill="#a3b0c4" fontSize="10.5" fontWeight={600}>
                {formatCurrency(valor, 0)}
              </text>
            </g>
          );
        })}

        <line x1={margem.left} x2={largura - margem.right} y1={margem.top + areaAltura} y2={margem.top + areaAltura} stroke="#e8edf6" strokeWidth="1" />

        <line
          x1={margem.left} x2={largura - margem.right}
          y1={margem.top + areaAltura * 0.2} y2={margem.top + areaAltura * 0.2}
          stroke="#f4a3ac" strokeDasharray="6 5"
        />
        <text x={largura - margem.right} y={margem.top + areaAltura * 0.2 - 7} textAnchor="end" fill="#e26a78" fontSize="10" fontWeight={700}>
          corte 80%
        </text>

        {itens.map((item, index) => {
          const alturaBarra = (item.valor_estoque / maxValor) * areaAltura;
          const x = margem.left + passo * index + (passo - larguraBarra) / 2;
          const y = margem.top + areaAltura - alturaBarra;

          return (
            <g key={`${item.produto}-${index}`}>
              <title>{`${item.produto}: ${formatCurrency(item.valor_estoque)} — Classe ${item.classe}`}</title>
              <rect
                x={x} y={y} width={larguraBarra} height={Math.max(alturaBarra, 2)} rx="5" fill={CLASSE_COR[item.classe]}
                className="mm-bar"
                style={{ transformBox: 'fill-box', animationDelay: `calc(${index * 70}ms * var(--mm-scale, 1))` } as React.CSSProperties}
              />
              <text x={x + larguraBarra / 2} y={altura - 34} textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontWeight={600}>
                {truncateLabel(item.produto)}
              </text>
            </g>
          );
        })}

        <polyline
          points={pontos} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
          className="mm-line" pathLength={900}
          style={{ animationDelay: 'calc(300ms * var(--mm-scale, 1))' }}
        />
        {itens.map((item, index) => {
          const cx = margem.left + passo * index + passo / 2;
          const cy = margem.top + areaAltura - (item.percentual_acumulado / 100) * areaAltura;
          return (
            <g key={`${item.produto}-point-${index}`}>
              <title>{`${formatNumber(item.percentual_acumulado)}% acumulado`}</title>
              <circle cx={cx} cy={cy} r="4" fill="#fff" stroke="#10b981" strokeWidth="2.5" />
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11.5px] font-semibold text-[#64748b]">
        <span className="flex items-center gap-1.5"><i className="block h-2.25 w-2.25 rounded-[3px]" style={{ background: CLASSE_COR.A }} />Classe A</span>
        <span className="flex items-center gap-1.5"><i className="block h-2.25 w-2.25 rounded-[3px]" style={{ background: CLASSE_COR.B }} />Classe B</span>
        <span className="flex items-center gap-1.5"><i className="block h-2.25 w-2.25 rounded-[3px]" style={{ background: CLASSE_COR.C }} />Classe C</span>
        <span className="flex items-center gap-1.5"><i className="block h-0.5 w-4 bg-[#10b981]" />Percentual acumulado</span>
      </div>
    </div>
  );
}

function DonutChart({ categorias }: { categorias: LucroCategoria[] }) {
  const categoriasValidas = categorias.filter((categoria) => categoria.percentual > 0);

  const gradient = useMemo(() => {
    if (categoriasValidas.length === 0) return "conic-gradient(#eef2f9 0% 100%)";

    let acumulado = 0;
    const partes = categoriasValidas.map((categoria, index) => {
      const inicio = acumulado;
      acumulado += categoria.percentual;
      const fim = index === categoriasValidas.length - 1 ? 100 : Math.min(acumulado, 100);
      return `${CORES_CATEGORIAS[index % CORES_CATEGORIAS.length]} ${inicio}% ${fim}%`;
    });

    return `conic-gradient(${partes.join(", ")})`;
  }, [categoriasValidas]);

  if (categoriasValidas.length === 0) {
    return <EmptyState texto="Ainda não há lucro calculável nas categorias cadastradas." />;
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-29.5 w-29.5 shrink-0 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-[27%] flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-[13.5px] font-extrabold text-[#0f172a]">{categoriasValidas.length}</span>
          <span className="text-[9px] font-semibold tracking-[.04em] text-[#94a3b8]">NICHOS</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2 text-[12.5px] text-[#475569]">
        {categoriasValidas.map((categoria, index) => (
          <span key={categoria.categoria} className="flex items-center gap-2" title={formatCurrency(categoria.lucro)}>
            <i className="block h-2.25 w-2.25 shrink-0 rounded-[3px]" style={{ background: CORES_CATEGORIAS[index % CORES_CATEGORIAS.length] }} />
            <span className="truncate">{categoria.categoria}</span>
            <b className="ml-auto shrink-0 text-[#0f172a]">{formatNumber(categoria.percentual)}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-[#e4eaf4] bg-[#f8fafd] px-5 text-center text-sm text-[#8494ad]">
      {texto}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="max-w-330 px-8.5 pb-13 pt-7.5 mm-fade">
      <div className="mm-skeleton h-7 w-64 rounded-lg" />
      <div className="mm-skeleton mt-3 h-4 w-72 rounded" style={{ animationDelay: '80ms' }} />
      <div className="mt-6.5 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(258px, 1fr))' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mm-skeleton h-32 rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1.75fr) minmax(0,1fr)' }}>
        <div className="mm-skeleton h-88 rounded-2xl" />
        <div className="flex flex-col gap-4">
          <div className="mm-skeleton h-40 rounded-2xl" />
          <div className="mm-skeleton h-52 rounded-2xl" style={{ animationDelay: '80ms' }} />
        </div>
      </div>
      <div className="mm-skeleton mt-4 h-64 rounded-2xl" />
    </div>
  );
}

export default function RelatorioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [relatorio, setRelatorio] = useState<RelatorioResponse | null>(null);
  const [loadingRelatorio, setLoadingRelatorio] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarRelatorio = useCallback(async () => {
    setLoadingRelatorio(true);
    setErro(null);

    try {
      const response = await apiFetch("/api/relatorio");

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? "Não foi possível carregar o relatório.");
      }

      const dados = await response.json() as RelatorioResponse;
      setRelatorio(dados);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar o relatório.");
    } finally {
      setLoadingRelatorio(false);
    }
  }, [router]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) void carregarRelatorio();
  }, [user, carregarRelatorio]);

  if (loading || (user && loadingRelatorio && !relatorio)) return <LoadingScreen />;
  if (!user) return <LoadingScreen />;

  if (erro || !relatorio) {
    return (
      <div className="flex h-full items-center justify-center p-8 mm-fade">
        <div className="w-full max-w-lg rounded-2xl border border-[#e4eaf4] bg-white p-8 text-center shadow-sm mm-pop-in">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={38} />
          <h1 className="text-xl font-bold text-[#0f172a]">Erro ao consultar o banco de dados</h1>
          <p className="mt-3 text-sm text-[#64748b]">{erro ?? "O relatório não retornou dados."}</p>
          <button
            type="button"
            onClick={() => void carregarRelatorio()}
            className="mm-hover mx-auto mt-6 flex items-center gap-2 rounded-xl bg-[#1a3673] px-5 py-3 font-bold text-white hover:bg-[#0080ff]"
          >
            <RefreshCw size={18} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { resumo } = relatorio;
  const lucroRealizado = resumo.fonte_lucro_categoria === "vendas_realizadas";

  return (
    <div className="max-w-330 px-8.5 pb-13 pt-7.5 mm-screen-in">

      <div className="mb-5.5">
        <p className="text-xs font-bold uppercase tracking-[.09em] text-[#0080ff]">Relatório da loja</p>
        <h1 className="mt-1.5 text-[29px] font-extrabold tracking-tight text-[#0f172a]">Visão geral financeira</h1>
        <p className="mt-1.5 text-sm text-[#64748b]">
          Dados atualizados diretamente do banco da loja · {resumo.total_pedidos} {resumo.total_pedidos === 1 ? "pedido registrado" : "pedidos registrados"}
        </p>
      </div>

      <div className="mm-stagger grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(258px, 1fr))' }}>
        <div className="mm-rise-in rounded-2xl bg-[#1a3673] p-6.5 text-white" style={{ '--mm-i': 0 } as React.CSSProperties}>
          <p className="text-[11.5px] font-bold uppercase tracking-[.07em] text-[#a8c2ee]">Liquidez em estoque</p>
          <p className="mt-3 whitespace-nowrap text-[clamp(23px,2.2vw,33px)] font-extrabold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <CountUp to={resumo.liquidez_estoque} format={(v) => formatCurrency(v)} />
          </p>
          <p className="mt-2.5 max-w-67.5 text-[12.5px] leading-relaxed text-[#bcd0f2]">
            Potencial de faturamento de {resumo.total_unidades_estoque} peças, com base nos preços atuais cadastrados.
          </p>
        </div>

        <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-6.5" style={{ '--mm-i': 1 } as React.CSSProperties}>
          <p className="text-[11.5px] font-bold uppercase tracking-[.07em] text-[#8494ad]">UPT · peças por venda</p>
          <p className="mt-3 whitespace-nowrap text-[clamp(23px,2.2vw,33px)] font-extrabold tracking-tight text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <CountUp to={resumo.upt} format={(v) => formatNumber(v, 2)} />
          </p>
          <p className="mt-2.5 text-[12.5px] text-[#64748b]">Lucro médio ponderado por peça: {formatCurrency(resumo.lucro_medio_peca)}</p>
        </div>

        <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-6.5" style={{ '--mm-i': 2 } as React.CSSProperties}>
          <p className="text-[11.5px] font-bold uppercase tracking-[.07em] text-[#8494ad]">Ticket médio por pedido</p>
          <p className="mt-3 whitespace-nowrap text-[clamp(23px,2.2vw,33px)] font-extrabold tracking-tight text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <CountUp to={resumo.ticket_medio} format={(v) => formatCurrency(v)} />
          </p>
          <p className="mt-2.5 text-[12.5px] text-[#64748b]">
            Base: {resumo.total_pedidos} {resumo.total_pedidos === 1 ? "pedido registrado" : "pedidos registrados"}
          </p>
        </div>
      </div>

      <div className="mm-stagger mt-4 grid items-start gap-4" style={{ gridTemplateColumns: 'minmax(0,1.75fr) minmax(0,1fr)' }}>

        <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-6.5" style={{ '--mm-i': 3 } as React.CSSProperties}>
          <h2 className="text-[17px] font-bold text-[#0f172a]">Curva ABC (Pareto)</h2>
          <p className="mt-1 text-[13px] text-[#64748b]">Classificação pelo valor de venda do estoque de cada produto</p>
          <div className="mt-6.5">
            <ParetoChart itens={relatorio.curva_abc} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-5.5" style={{ '--mm-i': 4 } as React.CSSProperties}>
            <h3 className="text-[15px] font-bold text-[#0f172a]">Composição do lucro</h3>
            <p className="mb-4.5 mt-1 text-[12.5px] text-[#64748b]">
              {lucroRealizado ? "Pelas vendas registradas em pedidos" : "Lucro potencial do estoque atual"}
            </p>
            <DonutChart categorias={relatorio.lucro_por_categoria} />
          </div>

          <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-5.5" style={{ '--mm-i': 5 } as React.CSSProperties}>
            <h3 className="mb-4.5 text-[15px] font-bold text-[#0f172a]">Distribuição de estoque por nicho</h3>
            {relatorio.estoque_por_categoria.length > 0 ? (
              <div className="flex flex-col gap-3">
                {relatorio.estoque_por_categoria.map((item) => (
                  <div key={item.categoria} className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-3">
                    <span className="truncate text-right text-[12.5px] font-semibold text-[#475569]" title={item.categoria}>{item.categoria}</span>
                    <div className="h-6 overflow-hidden rounded-[7px] bg-[#f1f5fb]">
                      <div
                        className="mm-row flex h-full min-w-fit items-center justify-end rounded-[7px] px-2.25 text-[11px] font-bold text-white"
                        style={{ width: `${Math.max(item.percentual, item.percentual > 0 ? 9 : 0)}%`, background: 'linear-gradient(90deg,#1a3673,#2563eb)' }}
                        title={`${item.quantidade} unidades`}
                      >
                        {formatNumber(item.percentual)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState texto="Ainda não existem unidades em estoque para distribuir por categoria." />
            )}
          </div>
        </div>
      </div>

      <div className="mm-rise-in mt-4 overflow-hidden rounded-2xl border border-[#e4eaf4] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6.5 py-5.5 pb-4">
          <h2 className="text-[17px] font-bold text-[#0f172a]">Top peças com maior lucro unitário</h2>
          <span className="text-[12.5px] text-[#64748b]">
            Lucro médio ponderado por peça em estoque: <b className="text-[#047857]">{formatCurrency(resumo.lucro_medio_peca)}</b>
          </span>
        </div>
        {relatorio.produtos_maior_lucro.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-165">
              <div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_0.8fr_0.8fr] gap-3 border-y border-[#eef2f8] bg-[#fafbfe] px-6.5 py-2.75 text-[11.5px] font-bold uppercase tracking-wider text-[#8494ad]">
                <span>Produto</span><span>Categoria</span><span>Custo</span><span>Venda</span><span>Lucro un.</span><span>Markup</span>
              </div>
              {relatorio.produtos_maior_lucro.map((produto, index) => (
                <div
                  key={`${produto.produto}-${index}`}
                  className="mm-hover grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_0.8fr_0.8fr] gap-3 border-b border-[#f4f7fb] px-6.5 py-3.25 text-[13.5px] text-[#334155] hover:bg-[#f8fbff]"
                >
                  <span className="truncate font-semibold text-[#0f172a]">{produto.produto}</span>
                  <span className="truncate">{produto.categoria}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(produto.custo)}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(produto.venda)}</span>
                  <span className="font-bold text-[#047857]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(produto.lucro_unitario)}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(produto.margem_percentual)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6.5 pb-6.5"><EmptyState texto="Cadastre preço de venda nos produtos para calcular o lucro." /></div>
        )}
      </div>
    </div>
  );
}
