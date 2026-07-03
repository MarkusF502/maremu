"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Info,
  CheckCircle2,
  Store,
  ChevronRight,
  AlertTriangle,
  Percent,
  DollarSign,
  ShoppingBag,
  Tag,
  BarChart2,
  Users,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";

type Canal = {
  canal: string;
  taxa_percentual: number;
  taxa_origem: string;
};

type InferredData = {
  nome: string;
  loja: {
    faturamento_medio_mensal: number;
    custo_fixo_mensal: number;
    custo_fixo_origem: string;
    volume_vendas_esperado: number;
    margem_lucro_desejada: number;
    posicionamento: string;
    regime_tributario: string;
    aliquota_efetiva: number;
    aliquota_origem: string;
  };
  canais: Canal[];
  resumo: {
    faixa_faturamento: string;
    total_campos_preenchidos: number;
    aviso_contador: boolean;
  };
  tooltips: Record<string, string>;
};

// ── Helpers ──────────────────────────────────────────────────────────────

const CANAL_LABELS: Record<string, string> = {
  loja_fisica:         "Loja Física",
  instagram_whatsapp:  "Instagram / WhatsApp",
  marketplace:         "Marketplace (Shopee, ML)",
};

function pct(val: number) {
  return (val * 100).toFixed(0);
}

function brl(val: number) {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ── Componente de campo de revisão ────────────────────────────────────────

function ReviewField({
  label,
  tooltip,
  icon: Icon,
  children,
}: {
  label: string;
  tooltip?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {Icon && <Icon size={13} className="text-[#2563EB]" />}
        {label}
        {tooltip && (
          <span className="group relative ml-auto cursor-pointer">
            <Info size={13} className="text-slate-300 hover:text-slate-500 transition-colors" />
            <span className="pointer-events-none absolute bottom-full right-0 mb-2 w-52 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-20 leading-relaxed">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// ── Passo 1 ──────────────────────────────────────────────────────────────

function StepQuestions({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (data: {
    nomeLoja: string;
    faixaFaturamento: string;
    posicionamento: string;
    regime: string;
    canais: string[];
  }) => void;
  isLoading: boolean;
  error: string;
}) {
  const [nomeLoja, setNomeLoja]               = useState("");
  const [faixaFaturamento, setFaixaFaturamento] = useState("de_10k_a_30k");
  const [posicionamento, setPosicionamento]   = useState("medio");
  const [regime, setRegime]                   = useState("simples_nacional");
  const [canais, setCanais]                   = useState<string[]>([]);
  const [localError, setLocalError]           = useState("");

  const toggle = (canal: string) =>
    setCanais((prev) =>
      prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canais.length === 0) {
      setLocalError("Selecione pelo menos um canal de venda.");
      return;
    }
    setLocalError("");
    onSubmit({ nomeLoja, faixaFaturamento, posicionamento, regime, canais });
  };

  const displayError = localError || error;

  const selectClass =
    "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#334155] text-sm focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all outline-none";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-10 px-4 flex flex-col items-center">
      {/* Cabeçalho fixo acima do card */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-28 h-12 relative">
          <Image src="/logo.png" alt="Maremu" fill className="object-contain" />
        </div>
        {/* Indicador de etapa */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold">1</span>
          <span className="font-medium text-[#2563EB]">Sobre sua loja</span>
          <ChevronRight size={14} />
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-xs font-bold">2</span>
          <span>Revisar estimativas</span>
        </div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1E293B]">Configure sua loja</h1>
          <p className="text-sm text-slate-500 mt-1">
            Com base nas suas respostas, vamos calcular automaticamente impostos, custo fixo e margem de referência.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {displayError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              <AlertTriangle size={16} className="shrink-0" />
              {displayError}
            </div>
          )}

          {/* Nome */}
          <ReviewField label="Nome da loja" icon={Store}>
            <input
              type="text"
              value={nomeLoja}
              onChange={(e) => setNomeLoja(e.target.value)}
              required
              placeholder="Ex: Maremu Modas"
              className={selectClass}
            />
          </ReviewField>

          {/* Faturamento */}
          <ReviewField label="Faturamento médio mensal" icon={BarChart2}>
            <select
              value={faixaFaturamento}
              onChange={(e) => setFaixaFaturamento(e.target.value)}
              className={selectClass}
            >
              <option value="ate_10k">Até R$ 10.000</option>
              <option value="de_10k_a_30k">R$ 10.000 a R$ 30.000</option>
              <option value="de_30k_a_80k">R$ 30.000 a R$ 80.000</option>
              <option value="acima_80k">Acima de R$ 80.000</option>
            </select>
          </ReviewField>

          {/* Posicionamento */}
          <ReviewField label="Posicionamento da marca" icon={Tag}>
            <select
              value={posicionamento}
              onChange={(e) => setPosicionamento(e.target.value)}
              className={selectClass}
            >
              <option value="popular">Popular — foco em volume e preço acessível</option>
              <option value="medio">Médio — equilíbrio entre qualidade e preço</option>
              <option value="premium">Premium — exclusividade e margem alta</option>
            </select>
          </ReviewField>

          {/* Regime */}
          <ReviewField label="Regime tributário" icon={ShoppingBag}>
            <select
              value={regime}
              onChange={(e) => setRegime(e.target.value)}
              className={selectClass}
            >
              <option value="simples_nacional">Simples Nacional</option>
              <option value="lucro_presumido">Lucro Presumido</option>
              <option value="lucro_real">Lucro Real</option>
            </select>
          </ReviewField>

          {/* Canais */}
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <Users size={13} className="text-[#2563EB]" />
              Onde você vende?
            </span>
            <p className="text-xs text-slate-400">Selecione um ou mais canais</p>
            <div className="grid grid-cols-1 gap-2">
              {(["loja_fisica", "instagram_whatsapp", "marketplace"] as const).map((id) => {
                const ativo = canais.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      ativo
                        ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                        ativo ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300"
                      }`}
                    >
                      {ativo && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                    </span>
                    {CANAL_LABELS[id]}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E3A8A] text-white text-sm font-bold shadow-md shadow-[#2563EB]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Calculando estimativas...
              </>
            ) : (
              <>
                Calcular estimativas
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Passo 2 ──────────────────────────────────────────────────────────────

function StepReview({
  inferredData,
  onBack,
  onSubmit,
  isLoading,
  error,
}: {
  inferredData: InferredData;
  onBack: () => void;
  onSubmit: (data: InferredData) => void;
  isLoading: boolean;
  error: string;
}) {
  const [data, setData] = useState<InferredData>(inferredData);

  const setLoja = (patch: Partial<InferredData["loja"]>) =>
    setData((d) => ({ ...d, loja: { ...d.loja, ...patch } }));

  const setCanal = (canal: string, taxa: number) =>
    setData((d) => ({
      ...d,
      canais: d.canais.map((c) =>
        c.canal === canal
          ? { ...c, taxa_percentual: taxa, taxa_origem: "editado_pelo_lojista" }
          : c
      ),
    }));

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-[#1E293B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-10 px-4 flex flex-col items-center">
      {/* Cabeçalho */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-28 h-12 relative">
          <Image src="/logo.png" alt="Maremu" fill className="object-contain" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
            <CheckCircle2 size={14} className="text-[#2563EB]" />
          </span>
          <span className="text-slate-400 line-through text-xs">Sobre sua loja</span>
          <ChevronRight size={14} />
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold">2</span>
          <span className="font-medium text-[#2563EB]">Revisar estimativas</span>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {/* Cabeçalho do card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-[#1E293B]">Revise as estimativas da sua loja</h1>
              <p className="text-sm text-slate-500 mt-1">
                Calculamos <span className="font-semibold text-[#2563EB]">{data.resumo.total_campos_preenchidos} campos</span> automaticamente. Edite qualquer valor antes de continuar — você pode ajustá-los novamente nas configurações.
              </p>
            </div>
          </div>

          {data.resumo.aviso_contador && (
            <div className="mt-4 flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Confirme a alíquota com seu contador.</strong> Para Lucro Presumido ou Lucro Real, os impostos variam conforme o lucro apurado. Usamos uma estimativa conservadora.
              </p>
            </div>
          )}
        </div>

        {/* Seção: Financeiro */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dados Financeiros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReviewField
              label="Custo fixo mensal"
              icon={DollarSign}
              tooltip={data.tooltips.custo_fixo_mensal}
            >
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={data.loja.custo_fixo_mensal}
                  onChange={(e) =>
                    setLoja({
                      custo_fixo_mensal: Number(e.target.value),
                      custo_fixo_origem: "editado_pelo_lojista",
                    })
                  }
                  className={`${inputClass} pl-10`}
                />
              </div>
              <p className="text-xs text-slate-400">Aluguel + salários + sistema + contador etc.</p>
            </ReviewField>

            <ReviewField
              label="Margem de lucro desejada"
              icon={Percent}
              tooltip={data.tooltips.margem_lucro_desejada}
            >
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  value={Number(pct(data.loja.margem_lucro_desejada))}
                  onChange={(e) =>
                    setLoja({ margem_lucro_desejada: Number(e.target.value) / 100 })
                  }
                  className={`${inputClass} pr-8`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-400">% de lucro sobre cada venda</p>
            </ReviewField>

            <ReviewField
              label="Alíquota de imposto"
              tooltip={data.tooltips.aliquota_efetiva}
            >
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="99"
                  value={Number((data.loja.aliquota_efetiva * 100).toFixed(1))}
                  onChange={(e) =>
                    setLoja({
                      aliquota_efetiva: Number(e.target.value) / 100,
                      aliquota_origem: "editado_pelo_lojista",
                    })
                  }
                  className={`${inputClass} pr-8`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-400">Regime: <span className="font-medium capitalize">{data.loja.regime_tributario.replace("_", " ")}</span></p>
            </ReviewField>

            <ReviewField
              label="Volume de vendas esperado"
              tooltip={data.tooltips.volume_vendas_esperado}
            >
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={data.loja.volume_vendas_esperado}
                  onChange={(e) =>
                    setLoja({ volume_vendas_esperado: Number(e.target.value) })
                  }
                  className={`${inputClass} pr-16`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-xs">peças/mês</span>
              </div>
              <p className="text-xs text-slate-400">Estimativa para ratear o custo fixo por peça</p>
            </ReviewField>
          </div>
        </div>

        {/* Seção: Canais */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Taxas dos Canais de Venda</h2>
          <div className="space-y-3">
            {data.canais.map((c) => (
              <div key={c.canal} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1E293B]">{CANAL_LABELS[c.canal]}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {data.tooltips[`taxa_canal_${c.canal}`] ?? "Taxa de comissão ou cartão deste canal"}
                  </p>
                </div>
                <div className="relative w-28 shrink-0">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="99"
                    value={Number((c.taxa_percentual * 100).toFixed(1))}
                    onChange={(e) => setCanal(c.canal, Number(e.target.value) / 100)}
                    className={`${inputClass} pr-8 text-right`}
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo do que foi configurado */}
        <div className="bg-[#EFF6FF] rounded-2xl border border-blue-100 px-6 py-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-3">Resumo</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: "Faturamento est.", value: `R$ ${brl(data.loja.faturamento_medio_mensal)}` },
              { label: "Custo fixo",       value: `R$ ${brl(data.loja.custo_fixo_mensal)}` },
              { label: "Margem alvo",      value: `${pct(data.loja.margem_lucro_desejada)}%` },
              { label: "Imposto est.",     value: `${(data.loja.aliquota_efetiva * 100).toFixed(1)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-bold text-[#1E293B]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 pb-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={() => onSubmit(data)}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-md shadow-[#2563EB]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              "Confirmar e acessar o sistema"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]           = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");
  const [inferredData, setInferredData] = useState<InferredData | null>(null);

  const handleInferir = async ({
    nomeLoja,
    faixaFaturamento,
    posicionamento,
    regime,
    canais,
  }: {
    nomeLoja: string;
    faixaFaturamento: string;
    posicionamento: string;
    regime: string;
    canais: string[];
  }) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/loja/onboarding/inferir", {
        method: "POST",
        body: JSON.stringify({
          nome: nomeLoja,
          faixa_faturamento: faixaFaturamento,
          posicionamento,
          regime,
          canais,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "Erro ao gerar estimativas.");
        return;
      }

      const data: InferredData = await res.json();
      setInferredData(data);
      setStep(2);
      window.scrollTo(0, 0);
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvar = async (data: InferredData) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/loja/onboarding/salvar", {
        method: "POST",
        body: JSON.stringify({
          nome:                     data.nome,
          posicionamento:           data.loja.posicionamento,
          regime_tributario:        data.loja.regime_tributario,
          faturamento_medio_mensal: data.loja.faturamento_medio_mensal,
          custo_fixo_mensal:        data.loja.custo_fixo_mensal,
          custo_fixo_origem:        data.loja.custo_fixo_origem,
          margem_lucro_desejada:    data.loja.margem_lucro_desejada,
          aliquota_efetiva:         data.loja.aliquota_efetiva,
          aliquota_origem:          data.loja.aliquota_origem,
          volume_vendas_esperado:   data.loja.volume_vendas_esperado,
          canais:                   data.canais,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "Erro ao salvar os dados da loja.");
        return;
      }

      router.push("/inicio");
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <StepQuestions
        onSubmit={handleInferir}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return (
    <StepReview
      inferredData={inferredData!}
      onBack={() => { setError(""); setStep(1); }}
      onSubmit={handleSalvar}
      isLoading={isLoading}
      error={error}
    />
  );
}