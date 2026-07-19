"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";

const alertas = [
  'Calça Jeans Skinny - Tamanho 40" está com 1 unidade',
  'Blusa Tricô Trançado - Tamanho G" está com 3 unidades',
  'Vestido Midi Floral - Tamanho G" está com 3 unidades',
  'T-shirt Básica Algodão - Tamanho P" está com 5 unidades',
];

const produtosLucrativos = [
  { produto: "Vestido Midi Floral", custo: "R$ 85,00", venda: "R$ 210,00", lucro: "R$ 125,00", margem: "147%" },
  { produto: "Jaqueta Jeans Trucker", custo: "R$ 90,00", venda: "R$ 199,90", lucro: "R$ 109,90", margem: "122%" },
  { produto: "Calça Cargo Slim", custo: "R$ 75,00", venda: "R$ 169,90", lucro: "R$ 94,90", margem: "126%" },
  { produto: "Camisa Oxford Slim", custo: "R$ 70,00", venda: "R$ 149,90", lucro: "R$ 79,90", margem: "114%" },
];

const estoquePorNicho = [
  { nome: "Camisaria", valor: 85 },
  { nome: "Calças & Jeans", valor: 60 },
  { nome: "Vestidos", valor: 42 },
  { nome: "Acessórios", valor: 25 },
];

const pareto = [
  { nome: "Camisa Oxford", classe: "A", valor: 3600, acumulado: 58 },
  { nome: "Calça Cargo", classe: "A", valor: 2900, acumulado: 76 },
  { nome: "T-shirt Básica", classe: "A", valor: 2450, acumulado: 87 },
  { nome: "Vestido Midi", classe: "B", valor: 1450, acumulado: 93 },
  { nome: "Jaqueta Jeans", classe: "B", valor: 950, acumulado: 97 },
  { nome: "Cinto Couro", classe: "C", valor: 600, acumulado: 100 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function ParetoChart() {
  const largura = 640;
  const altura = 275;
  const margem = { top: 24, right: 44, bottom: 58, left: 62 };
  const areaLargura = largura - margem.left - margem.right;
  const areaAltura = altura - margem.top - margem.bottom;
  const maxValor = 4000;
  const passo = areaLargura / pareto.length;
  const larguraBarra = passo * 0.68;
  const pontos = pareto
    .map((item, index) => {
      const x = margem.left + passo * index + passo / 2;
      const y = margem.top + areaAltura - (item.acumulado / 100) * areaAltura;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full overflow-x-auto pb-1">
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="h-auto min-w-[540px] w-full"
        role="img"
        aria-label="Gráfico de curva ABC de produtos"
      >
        <defs>
          <linearGradient id="pareto-bar-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d3ce8" />
          </linearGradient>
          <linearGradient id="pareto-bar-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#438df6" />
            <stop offset="100%" stopColor="#2875dc" />
          </linearGradient>
          <linearGradient id="pareto-bar-c" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9ba9c3" />
            <stop offset="100%" stopColor="#7c8ba7" />
          </linearGradient>
          <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0, 1000, 2000, 3000, 4000].map((valor) => {
          const y = margem.top + areaAltura - (valor / maxValor) * areaAltura;
          return (
            <g key={valor}>
              <line x1={margem.left} x2={largura - margem.right} y1={y} y2={y} stroke="#33415f" strokeWidth="1" opacity="0.45" />
              <text x={margem.left - 12} y={y + 4} textAnchor="end" fill="#9aa9c4" fontSize="11">
                {formatCurrency(valor)}
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

        {pareto.map((item, index) => {
          const alturaBarra = (item.valor / maxValor) * areaAltura;
          const x = margem.left + passo * index + (passo - larguraBarra) / 2;
          const y = margem.top + areaAltura - alturaBarra;
          const fill = item.classe === "A" ? "url(#pareto-bar-a)" : item.classe === "B" ? "url(#pareto-bar-b)" : "url(#pareto-bar-c)";

          return (
            <g key={item.nome}>
              <rect x={x} y={y} width={larguraBarra} height={alturaBarra} rx="5" fill={fill} />
              <text x={x + larguraBarra / 2} y={altura - 33} textAnchor="middle" fill="#a9b7cf" fontSize="9.5">{item.nome}</text>
            </g>
          );
        })}

        <polyline points={pontos} fill="none" stroke="#36e784" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" filter="url(#greenGlow)" />
        {pareto.map((item, index) => {
          const cx = margem.left + passo * index + passo / 2;
          const cy = margem.top + areaAltura - (item.acumulado / 100) * areaAltura;
          return <circle key={`${item.nome}-point`} cx={cx} cy={cy} r="5" fill="#36e784" stroke="#123d31" strokeWidth="2" />;
        })}
      </svg>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] text-[#9aa9c4] sm:text-xs">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-violet-500" /> Classe A (80%)</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Classe B (15%)</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-slate-400" /> Classe C (5%)</span>
      </div>
    </div>
  );
}

function DonutChart() {
  const categorias = [
    { nome: "Vestidos", valor: 45, cor: "#8b5cf6" },
    { nome: "Camisaria", valor: 30, cor: "#3b82f6" },
    { nome: "Jeans", valor: 15, cor: "#f59e0b" },
    { nome: "Acessórios", valor: 10, cor: "#ef4444" },
  ];

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center lg:gap-10">
      <div
        className="h-52 w-52 shrink-0 rounded-full"
        style={{ background: "conic-gradient(#8b5cf6 0% 45%, #3b82f6 45% 75%, #f59e0b 75% 90%, #ef4444 90% 100%)" }}
        aria-label="Composição do lucro por categoria"
      />
      <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs text-[#a7b6cf] md:grid-cols-1">
        {categorias.map((categoria) => (
          <div key={categoria.nome} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: categoria.cor }} />
            {categoria.nome} ({categoria.valor}%)
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <p className="font-medium text-slate-500">Carregando relatório...</p>
    </div>
  );
}

export default function RelatorioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading || !user) return <LoadingScreen />;

  return (
    <div className="-m-8 min-h-full bg-[#b8d7fc] px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Visão Geral Financeira</h1>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <article className="rounded-[20px] bg-[#24418f] p-7 text-white shadow-sm">
              <p className="mb-2 text-base text-blue-100">Liquidez em Estoque</p>
              <p className="text-[32px] font-extrabold leading-none tracking-tight sm:text-[38px]">R$ 48.910,00</p>
              <p className="mt-4 max-w-[250px] text-xs leading-relaxed text-blue-100">*Potencial de faturamento com base no preço atual de todas as peças do estoque</p>
            </article>

            <article className="rounded-[20px] bg-[#572381] p-7 text-white shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-extrabold"><AlertCircle size={23} /> Alertas Críticos</h2>
              <div className="space-y-4 pl-7 text-sm leading-[1.25] text-purple-50">
                {alertas.map((alerta) => <p key={alerta}>{alerta}</p>)}
              </div>
            </article>
          </div>

          <div className="grid gap-4">
            <article className="rounded-[20px] border-t-[5px] border-[#09152f] bg-[#0d1b3d] p-5 text-white shadow-sm sm:p-6">
              <h2 className="mb-2 text-lg font-extrabold sm:text-xl">Análise de Curva ABC (Pareto)</h2>
              <ParetoChart />
            </article>

            <article className="overflow-hidden rounded-[20px] bg-[#0d1b3d] text-white shadow-sm">
              <h2 className="px-5 pb-4 pt-5 text-lg font-extrabold sm:px-6 sm:text-xl">Top peças com maior Lucro Real</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                  <thead className="bg-[#19264c] text-white">
                    <tr>
                      <th className="px-5 py-4 font-bold">Produto</th><th className="px-4 py-4 font-bold">Custo</th><th className="px-4 py-4 font-bold">Venda</th><th className="px-4 py-4 font-bold">Lucro Un.</th><th className="px-4 py-4 font-bold">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#a8b6ce]">
                    {produtosLucrativos.map((produto, index) => (
                      <tr key={produto.produto} className={index % 2 === 0 ? "bg-[#111f42]" : "bg-[#0e1b3a]"}>
                        <td className="px-5 py-3.5 font-medium">{produto.produto}</td><td className="px-4 py-3.5">{produto.custo}</td><td className="px-4 py-3.5">{produto.venda}</td><td className="px-4 py-3.5 font-bold text-emerald-400">{produto.lucro}</td><td className="px-4 py-3.5">{produto.margem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="bg-[#0a1533] px-5 py-4 text-center text-[11px] font-semibold text-violet-400">Lucro Médio por Peça (Estoque Geral): R$ 51,25</p>
            </article>
          </div>
        </section>

        <section className="mt-4 rounded-[20px] bg-[#0d1b3d] px-5 py-5 text-white shadow-sm sm:px-7">
          <h2 className="mb-5 text-xl font-extrabold sm:text-2xl">Distribuição de Estoque por Nicho</h2>
          <div className="space-y-4">
            {estoquePorNicho.map((item) => (
              <div key={item.nome} className="grid grid-cols-[105px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[145px_minmax(0,1fr)]">
                <span className="text-right text-xs font-extrabold sm:text-sm">{item.nome}</span>
                <div className="h-8 overflow-hidden rounded-md bg-[#182542]">
                  <div className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-blue-500 to-violet-500 px-3 text-sm font-extrabold text-white" style={{ width: `${item.valor}%` }}>{item.valor}%</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm italic text-[#7f94b6]">Identificação de nichos com excesso de estoque (Overstock) ou sub-ofertados.</p>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <article className="rounded-[20px] bg-[#0d1b3d] p-5 text-white shadow-sm sm:p-7">
            <h2 className="mb-6 border-l-4 border-violet-500 pl-4 text-xl font-extrabold sm:text-2xl">Composição do Lucro por Categoria</h2>
            <DonutChart />
            <p className="mt-6 text-center text-xs text-[#788cac] sm:text-sm">Embora Camisaria tenha mais estoque, Vestidos são os maiores responsáveis pelo lucro líquido.</p>
          </article>

          <article className="flex flex-col justify-center rounded-[20px] bg-[#102c72] p-7 text-white shadow-sm">
            <h2 className="mb-7 text-xl font-extrabold">UPT e Ticket Médio</h2>
            <div><p className="text-5xl font-extrabold leading-none">2.4</p><p className="mt-1 text-sm font-bold">UPT (Peças por Venda)</p></div>
            <div className="mt-8"><p className="text-5xl font-extrabold leading-none">R$ 215</p><p className="mt-1 text-sm font-bold">Ticket Médio p/ Cliente</p></div>
          </article>
        </section>
      </div>
    </div>
  );
}
