"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { apiFetch } from "@/src/lib/api";

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

const CORES_CATEGORIAS = [
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#06b6d4",
  "#ec4899",
  "#a3e635",
];

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

function truncateLabel(label: string, max = 16) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function ParetoChart({ itens }: { itens: ItemCurvaAbc[] }) {
  if (itens.length === 0) {
    return <EmptyState texto="Cadastre produtos com preço e estoque para gerar a Curva ABC." />;
  }

  const largura = 720;
  const altura = 300;
  const margem = { top: 25, right: 50, bottom: 70, left: 76 };
  const areaLargura = largura - margem.left - margem.right;
  const areaAltura = altura - margem.top - margem.bottom;
  const maiorValor = Math.max(...itens.map((item) => item.valor_estoque), 1);
  const maxValor = maiorValor * 1.12;
  const passo = areaLargura / itens.length;
  const larguraBarra = Math.min(passo * 0.67, 58);
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
        className="h-auto min-w-[590px] w-full"
        role="img"
        aria-label="Curva ABC calculada com o valor real do estoque"
      >
        <defs>
          <linearGradient id="pareto-bar-a-real" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d3ce8" />
          </linearGradient>
          <linearGradient id="pareto-bar-b-real" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#438df6" />
            <stop offset="100%" stopColor="#2875dc" />
          </linearGradient>
          <linearGradient id="pareto-bar-c-real" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9ba9c3" />
            <stop offset="100%" stopColor="#7c8ba7" />
          </linearGradient>
          <filter id="greenGlowReal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ticksValor.map((valor) => {
          const y = margem.top + areaAltura - (valor / maxValor) * areaAltura;
          return (
            <g key={valor}>
              <line x1={margem.left} x2={largura - margem.right} y1={y} y2={y} stroke="#33415f" strokeWidth="1" opacity="0.45" />
              <text x={margem.left - 12} y={y + 4} textAnchor="end" fill="#9aa9c4" fontSize="11">
                {formatCurrency(valor, 0)}
              </text>
            </g>
          );
        })}

        {[0, 20, 40, 60, 80, 100].map((valor) => {
          const y = margem.top + areaAltura - (valor / 100) * areaAltura;
          return <text key={valor} x={largura - margem.right + 12} y={y + 4} fill="#9aa9c4" fontSize="11">{valor}%</text>;
        })}

        <line
          x1={margem.left}
          x2={largura - margem.right}
          y1={margem.top + areaAltura * 0.2}
          y2={margem.top + areaAltura * 0.2}
          stroke="#ef5a72"
          strokeDasharray="6 5"
          opacity="0.65"
        />
        <text x={largura - margem.right - 6} y={margem.top + areaAltura * 0.2 - 7} textAnchor="end" fill="#ef5a72" fontSize="10">Corte 80%</text>

        {itens.map((item, index) => {
          const alturaBarra = (item.valor_estoque / maxValor) * areaAltura;
          const x = margem.left + passo * index + (passo - larguraBarra) / 2;
          const y = margem.top + areaAltura - alturaBarra;
          const fill = item.classe === "A"
            ? "url(#pareto-bar-a-real)"
            : item.classe === "B"
              ? "url(#pareto-bar-b-real)"
              : "url(#pareto-bar-c-real)";

          return (
            <g key={`${item.produto}-${index}`}>
              <title>{`${item.produto}: ${formatCurrency(item.valor_estoque)} — Classe ${item.classe}`}</title>
              <rect x={x} y={y} width={larguraBarra} height={Math.max(alturaBarra, 2)} rx="5" fill={fill} />
              <text x={x + larguraBarra / 2} y={altura - 41} textAnchor="middle" fill="#a9b7cf" fontSize="9.5">
                {truncateLabel(item.produto)}
              </text>
              <text x={x + larguraBarra / 2} y={altura - 26} textAnchor="middle" fill="#6f82a5" fontSize="8.5">
                {formatCurrency(item.valor_estoque, 0)}
              </text>
            </g>
          );
        })}

        <polyline points={pontos} fill="none" stroke="#36e784" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" filter="url(#greenGlowReal)" />
        {itens.map((item, index) => {
          const cx = margem.left + passo * index + passo / 2;
          const cy = margem.top + areaAltura - (item.percentual_acumulado / 100) * areaAltura;
          return (
            <g key={`${item.produto}-point-${index}`}>
              <title>{`${formatNumber(item.percentual_acumulado)}% acumulado`}</title>
              <circle cx={cx} cy={cy} r="5" fill="#36e784" stroke="#123d31" strokeWidth="2" />
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] text-[#9aa9c4] sm:text-xs">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-violet-500" /> Classe A</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Classe B</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-slate-400" /> Classe C</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 bg-emerald-400" /> Percentual acumulado</span>
      </div>
    </div>
  );
}

function DonutChart({ categorias }: { categorias: LucroCategoria[] }) {
  const categoriasValidas = categorias.filter((categoria) => categoria.percentual > 0);

  const gradient = useMemo(() => {
    if (categoriasValidas.length === 0) return "conic-gradient(#243250 0% 100%)";

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
    <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center lg:gap-10">
      <div
        className="relative h-52 w-52 shrink-0 rounded-full"
        style={{ background: gradient }}
        aria-label="Composição do lucro por categoria com dados do banco"
      >
        <div className="absolute inset-[27%] rounded-full bg-[#0d1b3d]" />
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs text-[#a7b6cf] md:grid-cols-1">
        {categoriasValidas.map((categoria, index) => (
          <div key={categoria.categoria} className="flex items-center gap-2" title={formatCurrency(categoria.lucro)}>
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: CORES_CATEGORIAS[index % CORES_CATEGORIAS.length] }} />
            <span>{categoria.categoria} ({formatNumber(categoria.percentual)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.025] px-5 text-center text-sm text-[#8294b2]">
      {texto}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <p className="font-medium text-slate-500">Carregando dados...</p>
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
      <div className="-m-8 flex min-h-[calc(100vh-1px)] items-center justify-center bg-[#b8d7fc] p-8">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={38} />
          <h1 className="text-xl font-bold text-slate-900">Erro ao consultar o banco de dados</h1>
          <p className="mt-3 text-sm text-slate-600">{erro ?? "O relatório não retornou dados."}</p>
          <button
            type="button"
            onClick={() => void carregarRelatorio()}
            className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500"
          >
            <RefreshCw size={18} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { resumo } = relatorio;
  const alertasVisiveis = relatorio.alertas_criticos.slice(0, 6);
  const lucroRealizado = resumo.fonte_lucro_categoria === "vendas_realizadas";

  return (
    <div className="-m-8 min-h-full bg-[#b8d7fc] px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Visão Geral Financeira</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">Dados atualizados diretamente do banco da loja.</p>
          </div>
          <button
            type="button"
            onClick={() => void carregarRelatorio()}
            disabled={loadingRelatorio}
            className="flex items-center gap-2 rounded-xl bg-white/75 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw size={17} className={loadingRelatorio ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <article className="rounded-[20px] bg-[#24418f] p-7 text-white shadow-sm">
              <p className="mb-2 text-base text-blue-100">Liquidez em Estoque</p>
              <p className="break-words text-[30px] font-extrabold leading-none tracking-tight sm:text-[36px]">{formatCurrency(resumo.liquidez_estoque)}</p>
              <p className="mt-4 max-w-[250px] text-xs leading-relaxed text-blue-100">
                Potencial de faturamento de {resumo.total_unidades_estoque} peças, com base nos preços atuais cadastrados.
              </p>
            </article>

            <article className="rounded-[20px] bg-[#572381] p-7 text-white shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-extrabold"><AlertCircle size={23} /> Alertas Críticos</h2>
              {alertasVisiveis.length > 0 ? (
                <div className="space-y-4 pl-7 text-sm leading-[1.25] text-purple-50">
                  {alertasVisiveis.map((alerta, index) => <p key={`${alerta.produto}-${alerta.tamanho}-${index}`}>{alerta.mensagem}</p>)}
                  {relatorio.alertas_criticos.length > alertasVisiveis.length && (
                    <p className="font-bold text-purple-200">+ {relatorio.alertas_criticos.length - alertasVisiveis.length} outros alertas</p>
                  )}
                </div>
              ) : (
                <p className="pl-7 text-sm text-purple-100">Nenhuma variante está abaixo do estoque mínimo.</p>
              )}
            </article>
          </div>

          <div className="grid gap-4">
            <article className="rounded-[20px] border-t-[5px] border-[#09152f] bg-[#0d1b3d] p-5 text-white shadow-sm sm:p-6">
              <h2 className="mb-1 text-lg font-extrabold sm:text-xl">Análise de Curva ABC (Pareto)</h2>
              <p className="mb-2 text-xs text-[#7f94b6]">Classificação pelo valor de venda do estoque de cada produto.</p>
              <ParetoChart itens={relatorio.curva_abc} />
            </article>

            <article className="overflow-hidden rounded-[20px] bg-[#0d1b3d] text-white shadow-sm">
              <h2 className="px-5 pb-4 pt-5 text-lg font-extrabold sm:px-6 sm:text-xl">Top peças com maior lucro unitário</h2>
              {relatorio.produtos_maior_lucro.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[730px] border-collapse text-left text-xs">
                    <thead className="bg-[#19264c] text-white">
                      <tr>
                        <th className="px-5 py-4 font-bold">Produto</th>
                        <th className="px-4 py-4 font-bold">Custo</th>
                        <th className="px-4 py-4 font-bold">Venda</th>
                        <th className="px-4 py-4 font-bold">Lucro Un.</th>
                        <th className="px-4 py-4 font-bold">Markup</th>
                        <th className="px-4 py-4 font-bold">Estoque</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#a8b6ce]">
                      {relatorio.produtos_maior_lucro.map((produto, index) => (
                        <tr key={`${produto.produto}-${index}`} className={index % 2 === 0 ? "bg-[#111f42]" : "bg-[#0e1b3a]"}>
                          <td className="px-5 py-3.5 font-medium">{produto.produto}</td>
                          <td className="px-4 py-3.5">{formatCurrency(produto.custo)}</td>
                          <td className="px-4 py-3.5">{formatCurrency(produto.venda)}</td>
                          <td className={`px-4 py-3.5 font-bold ${produto.lucro_unitario >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(produto.lucro_unitario)}</td>
                          <td className="px-4 py-3.5">{formatNumber(produto.margem_percentual)}%</td>
                          <td className="px-4 py-3.5">{produto.estoque}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 pb-5"><EmptyState texto="Cadastre preço de venda nos produtos para calcular o lucro." /></div>
              )}
              <p className="bg-[#0a1533] px-5 py-4 text-center text-[11px] font-semibold text-violet-400">
                Lucro médio ponderado por peça em estoque: {formatCurrency(resumo.lucro_medio_peca)}
              </p>
            </article>
          </div>
        </section>

        <section className="mt-4 rounded-[20px] bg-[#0d1b3d] px-5 py-5 text-white shadow-sm sm:px-7">
          <h2 className="mb-5 text-xl font-extrabold sm:text-2xl">Distribuição de Estoque por Nicho</h2>
          {relatorio.estoque_por_categoria.length > 0 ? (
            <div className="space-y-4">
              {relatorio.estoque_por_categoria.map((item) => (
                <div key={item.categoria} className="grid grid-cols-[105px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[145px_minmax(0,1fr)]">
                  <span className="truncate text-right text-xs font-extrabold sm:text-sm" title={item.categoria}>{item.categoria}</span>
                  <div className="h-8 overflow-hidden rounded-md bg-[#182542]">
                    <div
                      className="flex h-full min-w-fit items-center justify-end rounded-md bg-gradient-to-r from-blue-500 to-violet-500 px-3 text-sm font-extrabold text-white"
                      style={{ width: `${Math.max(item.percentual, item.percentual > 0 ? 7 : 0)}%` }}
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
          <p className="mt-6 text-center text-sm italic text-[#7f94b6]">Percentual calculado sobre as unidades reais cadastradas nas variantes dos produtos.</p>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <article className="rounded-[20px] bg-[#0d1b3d] p-5 text-white shadow-sm sm:p-7">
            <h2 className="mb-2 border-l-4 border-violet-500 pl-4 text-xl font-extrabold sm:text-2xl">Composição do Lucro por Categoria</h2>
            <p className="mb-6 pl-5 text-xs text-[#7f94b6]">
              {lucroRealizado
                ? "Calculado pelas vendas registradas em pedidos e itens de pedido."
                : "Sem vendas registradas: exibindo o lucro potencial do estoque atual."}
            </p>
            <DonutChart categorias={relatorio.lucro_por_categoria} />
          </article>

          <article className="flex flex-col justify-center rounded-[20px] bg-[#102c72] p-7 text-white shadow-sm">
            <h2 className="mb-7 text-xl font-extrabold">UPT e Ticket Médio</h2>
            <div>
              <p className="text-5xl font-extrabold leading-none">{formatNumber(resumo.upt, 2)}</p>
              <p className="mt-1 text-sm font-bold">UPT (Peças por Venda)</p>
            </div>
            <div className="mt-8">
              <p className="break-words text-4xl font-extrabold leading-none">{formatCurrency(resumo.ticket_medio)}</p>
              <p className="mt-1 text-sm font-bold">Ticket Médio por Pedido</p>
            </div>
            <p className="mt-7 text-xs text-blue-200">Base: {resumo.total_pedidos} {resumo.total_pedidos === 1 ? "pedido registrado" : "pedidos registrados"}.</p>
          </article>
        </section>
      </div>
    </div>
  );
}
