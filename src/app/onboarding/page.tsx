"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Info,
  CheckCircle2,
  Store,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Percent,
  DollarSign,
  ShoppingBag,
  Tag,
  BarChart2,
  Users,
  Sparkles,
  PlusCircle,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";

// ── Tipos ────────────────────────────────────────────────────────────────

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

type CampoIa = { valor: number | string | null; explicacao: string; clampado?: boolean };

type EstimativasIa = {
  posicionamento: CampoIa;
  faturamento_medio_mensal: CampoIa;
  custo_fixo_mensal: CampoIa;
  margem_lucro_desejada: CampoIa;
  volume_vendas_esperado: CampoIa;
};

type DadosFactuais = {
  nomeLoja: string;
  regime: string;
  canais: string[];
};

// ── Helpers ──────────────────────────────────────────────────────────────

const CANAL_LABELS: Record<string, string> = {
  loja_fisica: "Loja Física",
  instagram_whatsapp: "Instagram / WhatsApp",
  marketplace: "Marketplace (Shopee, ML)",
};

const CANAIS_DISPONIVEIS = ["loja_fisica", "instagram_whatsapp", "marketplace"] as const;

const TEXTO_EXEMPLO =
  "Ex: 'Tenho uma loja de roupas femininas em Campinas, focada em moda casual com preço " +
  "acessível. Vendo cerca de 80 peças por mês, faturando em torno de R$ 12 mil. Tenho uma " +
  "funcionária, pago R$ 2.500 de aluguel e uns R$ 800 de outras contas fixas. Quero ter pelo " +
  "menos 25% de lucro.' — Não se preocupe em ser exato; você poderá revisar todos os valores " +
  "antes de confirmar.";

function pct(val: number) {
  return (val * 100).toFixed(0);
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: "Sobre a loja" },
    { n: 2, label: "Descreva o negócio" },
    { n: 3, label: "Revisar estimativas" },
  ];

  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <span
            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              s.n < current
                ? "bg-slate-100 text-[#2563EB]"
                : s.n === current
                ? "bg-[#2563EB] text-white"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            {s.n < current ? <CheckCircle2 size={14} /> : s.n}
          </span>
          <span className={s.n === current ? "font-medium text-[#2563EB]" : ""}>{s.label}</span>
          {i < steps.length - 1 && <ChevronRight size={14} />}
        </div>
      ))}
    </div>
  );
}

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

const selectClass =
  "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[#334155] text-sm focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all outline-none";
const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-[#1E293B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-10 px-4 flex flex-col items-center">
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-28 h-12 relative">
          <Image src="/logo.png" alt="Maremu" fill className="object-contain" />
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBox({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
      <AlertTriangle size={16} className="shrink-0" />
      {error}
    </div>
  );
}

// ── Tela 1 — Dados factuais ─────────────────────────────────────────────

function TelaFactual({
  onSubmit,
  error,
}: {
  onSubmit: (data: DadosFactuais) => void;
  error: string;
}) {
  const [nomeLoja, setNomeLoja] = useState("");
  const [regime, setRegime] = useState("simples_nacional");
  const [canais, setCanais] = useState<string[]>([]);
  const [localError, setLocalError] = useState("");

  const toggle = (canal: string) =>
    setCanais((prev) => (prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canais.length === 0) {
      setLocalError("Selecione pelo menos um canal de venda.");
      return;
    }
    setLocalError("");
    onSubmit({ nomeLoja, regime, canais });
  };

  const displayError = localError || error;

  return (
    <Shell>
      <StepIndicator current={1} />
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mt-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1E293B]">Configure sua loja</h1>
          <p className="text-sm text-slate-500 mt-1">
            Comece pelo que você já sabe de cor — no próximo passo, você vai descrever seu negócio
            com suas próprias palavras e a gente estima o resto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorBox error={displayError} />

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

          <ReviewField label="Regime tributário" icon={ShoppingBag}>
            <select value={regime} onChange={(e) => setRegime(e.target.value)} className={selectClass}>
              <option value="simples_nacional">Simples Nacional</option>
              <option value="lucro_presumido">Lucro Presumido</option>
              <option value="lucro_real">Lucro Real</option>
            </select>
          </ReviewField>

          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <Users size={13} className="text-[#2563EB]" />
              Onde você vende?
            </span>
            <p className="text-xs text-slate-400">Selecione um ou mais canais</p>
            <div className="grid grid-cols-1 gap-2">
              {CANAIS_DISPONIVEIS.map((id) => {
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
            className="w-full py-3.5 mt-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E3A8A] text-white text-sm font-bold shadow-md shadow-[#2563EB]/20 transition-all flex items-center justify-center gap-2"
          >
            Continuar
            <ChevronRight size={16} />
          </button>
        </form>
      </div>
    </Shell>
  );
}

// ── Tela 2 — Descreva seu negócio ───────────────────────────────────────

function TelaDescricao({
  onSubmit,
  onVoltar,
  isLoading,
  error,
}: {
  onSubmit: (texto: string) => void;
  onVoltar: () => void;
  isLoading: boolean;
  error: string;
}) {
  const [texto, setTexto] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(texto);
  };

  return (
    <Shell>
      <StepIndicator current={2} />
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mt-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <Sparkles size={18} className="text-[#2563EB]" />
            Descreva seu negócio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Conte como sua loja funciona hoje. Nossa IA vai estimar faturamento, custos, margem e
            volume de vendas a partir do que você escrever — você revisa tudo antes de confirmar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBox error={error} />

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            required
            minLength={50}
            maxLength={5000}
            rows={8}
            placeholder={TEXTO_EXEMPLO}
            className={`${selectClass} resize-none leading-relaxed`}
          />
          <p className="text-xs text-slate-400 text-right">{texto.length}/5000 (mínimo 50 caracteres)</p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onVoltar}
              disabled={isLoading}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
            <button
              type="submit"
              disabled={isLoading || texto.trim().length < 50}
              className="flex-1 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-md shadow-[#2563EB]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  Analisar
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}

// ── Tela 2B — Fallback: perguntas alternativas (faixa + posicionamento) ──

function TelaPerguntasFallback({
  motivo,
  onSubmit,
  isLoading,
  error,
}: {
  motivo: string;
  onSubmit: (data: { faixaFaturamento: string; posicionamento: string }) => void;
  isLoading: boolean;
  error: string;
}) {
  const [faixaFaturamento, setFaixaFaturamento] = useState("de_10k_a_30k");
  const [posicionamento, setPosicionamento] = useState("medio");

  const MOTIVO_LABELS: Record<string, string> = {
    texto_insuficiente: "Não conseguimos extrair informações suficientes do texto.",
    erro_api: "Não conseguimos processar sua descrição agora.",
    confianca_insuficiente: "O texto ficou um pouco vago para estimarmos com segurança.",
  };

  return (
    <Shell>
      <StepIndicator current={2} />
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mt-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1E293B]">Vamos de outro jeito</h1>
          <p className="text-sm text-slate-500 mt-1">
            {MOTIVO_LABELS[motivo] ?? "Vamos usar perguntas rápidas em vez do texto."} Responda as
            duas perguntas abaixo para continuarmos.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ faixaFaturamento, posicionamento });
          }}
          className="space-y-5"
        >
          <ErrorBox error={error} />

          <ReviewField label="Faturamento médio mensal" icon={BarChart2}>
            <select value={faixaFaturamento} onChange={(e) => setFaixaFaturamento(e.target.value)} className={selectClass}>
              <option value="ate_10k">Até R$ 10.000</option>
              <option value="de_10k_a_30k">R$ 10.000 a R$ 30.000</option>
              <option value="de_30k_a_80k">R$ 30.000 a R$ 80.000</option>
              <option value="acima_80k">Acima de R$ 80.000</option>
            </select>
          </ReviewField>

          <ReviewField label="Posicionamento da marca" icon={Tag}>
            <select value={posicionamento} onChange={(e) => setPosicionamento(e.target.value)} className={selectClass}>
              <option value="popular">Popular — foco em volume e preço acessível</option>
              <option value="medio">Médio — equilíbrio entre qualidade e preço</option>
              <option value="premium">Premium — exclusividade e margem alta</option>
            </select>
          </ReviewField>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-md shadow-[#2563EB]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
    </Shell>
  );
}

// ── Tela 3 — Revisão das estimativas da IA ───────────────────────────────

function TelaRevisaoIa({
  logId,
  dadosFactuais,
  estimativas,
  canaisSugeridos,
  onConfirmar,
  isLoading,
  error,
}: {
  logId: string;
  dadosFactuais: DadosFactuais;
  estimativas: EstimativasIa;
  canaisSugeridos: string[];
  onConfirmar: (payload: {
    log_id: string;
    nome: string;
    posicionamento: string;
    regime_tributario: string;
    faturamento_medio_mensal: number;
    custo_fixo_mensal: number;
    margem_lucro_desejada: number;
    volume_vendas_esperado: number;
    canais: string[];
  }) => void;
  isLoading: boolean;
  error: string;
}) {
  const [posicionamento, setPosicionamento] = useState(String(estimativas.posicionamento.valor ?? "medio"));
  const [faturamento, setFaturamento] = useState(Number(estimativas.faturamento_medio_mensal.valor ?? 0));
  const [custoFixo, setCustoFixo] = useState(Number(estimativas.custo_fixo_mensal.valor ?? 0));
  const [margem, setMargem] = useState(Number(estimativas.margem_lucro_desejada.valor ?? 0.25));
  const [volume, setVolume] = useState(Number(estimativas.volume_vendas_esperado.valor ?? 0));
  const [canais, setCanais] = useState<string[]>(dadosFactuais.canais);

  const toggleCanal = (canal: string) =>
    setCanais((prev) => (prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal]));

  const campoAusente = (c: CampoIa) => c.valor === null;

  return (
    <Shell>
      <StepIndicator current={3} />
      <div className="w-full max-w-2xl space-y-4 mt-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h1 className="text-lg font-bold text-[#1E293B]">Revise as estimativas da IA</h1>
          <p className="text-sm text-slate-500 mt-1">
            A partir do que você descreveu, estimamos os campos abaixo. Edite o que precisar antes
            de confirmar — você pode ajustar de novo depois, nas configurações.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <ReviewField label="Posicionamento da marca" icon={Tag}>
            <select value={posicionamento} onChange={(e) => setPosicionamento(e.target.value)} className={selectClass}>
              <option value="popular">Popular</option>
              <option value="medio">Médio</option>
              <option value="premium">Premium</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">{estimativas.posicionamento.explicacao}</p>
          </ReviewField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                { key: "faturamento", label: "Faturamento médio mensal", icon: BarChart2, value: faturamento, set: setFaturamento, campo: estimativas.faturamento_medio_mensal, prefix: "R$" },
                { key: "custoFixo", label: "Custo fixo mensal", icon: DollarSign, value: custoFixo, set: setCustoFixo, campo: estimativas.custo_fixo_mensal, prefix: "R$" },
              ] as const
            ).map(({ key, label, icon, value, set, campo, prefix }) => (
              <ReviewField key={key} label={label} icon={icon}>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">{prefix}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className={`${inputClass} pl-10`}
                  />
                </div>
                {campoAusente(campo) ? (
                  <p className="text-xs text-amber-600">Não conseguimos estimar — preencha manualmente.</p>
                ) : (
                  <p className="text-xs text-slate-400">{campo.explicacao}</p>
                )}
              </ReviewField>
            ))}

            <ReviewField label="Margem de lucro desejada" icon={Percent}>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  value={Number(pct(margem))}
                  onChange={(e) => setMargem(Number(e.target.value) / 100)}
                  className={`${inputClass} pr-8`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-400">{estimativas.margem_lucro_desejada.explicacao}</p>
            </ReviewField>

            <ReviewField label="Volume de vendas esperado">
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className={`${inputClass} pr-16`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-xs">peças/mês</span>
              </div>
              <p className="text-xs text-slate-400">{estimativas.volume_vendas_esperado.explicacao}</p>
            </ReviewField>
          </div>
        </div>

        {canaisSugeridos.length > 0 && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
            <h2 className="text-xs font-bold text-[#2563EB] uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <PlusCircle size={14} />
              Canais mencionados no seu texto
            </h2>
            <div className="flex flex-wrap gap-2">
              {canaisSugeridos.map((c) => {
                const ativo = canais.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCanal(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      ativo ? "border-[#2563EB] bg-white text-[#2563EB]" : "border-blue-200 bg-transparent text-blue-500 hover:bg-white/50"
                    }`}
                  >
                    {ativo ? "✓ " : "+ "}
                    {CANAL_LABELS[c] ?? c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <ErrorBox error={error} />

        <div className="flex gap-3 pb-2">
          <button
            onClick={() =>
              onConfirmar({
                log_id: logId,
                nome: dadosFactuais.nomeLoja,
                posicionamento,
                regime_tributario: dadosFactuais.regime,
                faturamento_medio_mensal: faturamento,
                custo_fixo_mensal: custoFixo,
                margem_lucro_desejada: margem,
                volume_vendas_esperado: volume,
                canais,
              })
            }
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
    </Shell>
  );
}

// ── Tela 3 (determinística) — reaproveitada do fluxo de fallback ────────

function TelaRevisaoDeterministica({
  inferredData,
  onSubmit,
  isLoading,
  error,
}: {
  inferredData: InferredData;
  onSubmit: (data: InferredData) => void;
  isLoading: boolean;
  error: string;
}) {
  const [data, setData] = useState<InferredData>(inferredData);

  const setLoja = (patch: Partial<InferredData["loja"]>) => setData((d) => ({ ...d, loja: { ...d.loja, ...patch } }));

  const setCanal = (canal: string, taxa: number) =>
    setData((d) => ({
      ...d,
      canais: d.canais.map((c) => (c.canal === canal ? { ...c, taxa_percentual: taxa, taxa_origem: "editado_pelo_lojista" } : c)),
    }));

  return (
    <Shell>
      <StepIndicator current={3} />
      <div className="w-full max-w-2xl space-y-4 mt-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h1 className="text-lg font-bold text-[#1E293B]">Revise as estimativas da sua loja</h1>
          <p className="text-sm text-slate-500 mt-1">
            Calculamos <span className="font-semibold text-[#2563EB]">{data.resumo.total_campos_preenchidos} campos</span> automaticamente. Edite qualquer valor antes de continuar.
          </p>

          {data.resumo.aviso_contador && (
            <div className="mt-4 flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Confirme a alíquota com seu contador.</strong> Para Lucro Presumido ou Lucro Real, os impostos variam conforme o lucro apurado.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dados Financeiros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReviewField label="Custo fixo mensal" icon={DollarSign} tooltip={data.tooltips.custo_fixo_mensal}>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={data.loja.custo_fixo_mensal}
                  onChange={(e) => setLoja({ custo_fixo_mensal: Number(e.target.value), custo_fixo_origem: "editado_pelo_lojista" })}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </ReviewField>

            <ReviewField label="Margem de lucro desejada" icon={Percent} tooltip={data.tooltips.margem_lucro_desejada}>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  value={Number(pct(data.loja.margem_lucro_desejada))}
                  onChange={(e) => setLoja({ margem_lucro_desejada: Number(e.target.value) / 100 })}
                  className={`${inputClass} pr-8`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
            </ReviewField>

            <ReviewField label="Alíquota de imposto" tooltip={data.tooltips.aliquota_efetiva}>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="99"
                  value={Number((data.loja.aliquota_efetiva * 100).toFixed(1))}
                  onChange={(e) => setLoja({ aliquota_efetiva: Number(e.target.value) / 100, aliquota_origem: "editado_pelo_lojista" })}
                  className={`${inputClass} pr-8`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
            </ReviewField>

            <ReviewField label="Volume de vendas esperado" tooltip={data.tooltips.volume_vendas_esperado}>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={data.loja.volume_vendas_esperado}
                  onChange={(e) => setLoja({ volume_vendas_esperado: Number(e.target.value) })}
                  className={`${inputClass} pr-16`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-xs">peças/mês</span>
              </div>
            </ReviewField>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Taxas dos Canais de Venda</h2>
          <div className="space-y-3">
            {data.canais.map((c) => (
              <div key={c.canal} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1E293B]">{CANAL_LABELS[c.canal]}</p>
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

        <ErrorBox error={error} />

        <div className="flex gap-3 pb-2">
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
    </Shell>
  );
}

// ── Componente principal ──────────────────────────────────────────────────

type Etapa =
  | { tipo: "factual" }
  | { tipo: "descricao" }
  | { tipo: "fallback_perguntas"; motivo: string }
  | { tipo: "revisao_ia"; logId: string; estimativas: EstimativasIa; canaisSugeridos: string[] }
  | { tipo: "revisao_determ"; inferredData: InferredData };

export default function OnboardingPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "factual" });
  const [dadosFactuais, setDadosFactuais] = useState<DadosFactuais | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFactual = (data: DadosFactuais) => {
    setDadosFactuais(data);
    setEtapa({ tipo: "descricao" });
  };

  const handleAnalisarTexto = async (texto: string) => {
    if (!dadosFactuais) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/loja/onboarding/analisar-texto", {
        method: "POST",
        body: JSON.stringify({
          texto_descritivo: texto,
          nome_loja: dadosFactuais.nomeLoja,
          regime_tributario: dadosFactuais.regime,
          canais_marcados: dadosFactuais.canais,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "Erro ao analisar o texto.");
        return;
      }

      const data = await res.json();

      if (data.fallback) {
        setEtapa({ tipo: "fallback_perguntas", motivo: data.motivo });
        return;
      }

      setEtapa({
        tipo: "revisao_ia",
        logId: data.log_id,
        estimativas: data.estimativas,
        canaisSugeridos: data.canais_sugeridos ?? [],
      });
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFallbackPerguntas = async ({
    faixaFaturamento,
    posicionamento,
  }: {
    faixaFaturamento: string;
    posicionamento: string;
  }) => {
    if (!dadosFactuais) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/loja/onboarding/inferir", {
        method: "POST",
        body: JSON.stringify({
          nome: dadosFactuais.nomeLoja,
          faixa_faturamento: faixaFaturamento,
          posicionamento,
          regime: dadosFactuais.regime,
          canais: dadosFactuais.canais,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "Erro ao gerar estimativas.");
        return;
      }

      const data: InferredData = await res.json();
      setEtapa({ tipo: "revisao_determ", inferredData: data });
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmarIa = async (payload: {
    log_id: string;
    nome: string;
    posicionamento: string;
    regime_tributario: string;
    faturamento_medio_mensal: number;
    custo_fixo_mensal: number;
    margem_lucro_desejada: number;
    volume_vendas_esperado: number;
    canais: string[];
  }) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/loja/onboarding/confirmar-ia", {
        method: "POST",
        body: JSON.stringify(payload),
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

  const handleSalvarDeterm = async (data: InferredData) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/loja/onboarding/salvar", {
        method: "POST",
        body: JSON.stringify({
          nome: data.nome,
          posicionamento: data.loja.posicionamento,
          regime_tributario: data.loja.regime_tributario,
          faturamento_medio_mensal: data.loja.faturamento_medio_mensal,
          custo_fixo_mensal: data.loja.custo_fixo_mensal,
          custo_fixo_origem: data.loja.custo_fixo_origem,
          margem_lucro_desejada: data.loja.margem_lucro_desejada,
          aliquota_efetiva: data.loja.aliquota_efetiva,
          aliquota_origem: data.loja.aliquota_origem,
          volume_vendas_esperado: data.loja.volume_vendas_esperado,
          canais: data.canais,
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

  switch (etapa.tipo) {
    case "factual":
      return <TelaFactual onSubmit={handleFactual} error={error} />;

    case "descricao":
      return (
        <TelaDescricao
          onSubmit={handleAnalisarTexto}
          onVoltar={() => setEtapa({ tipo: "factual" })}
          isLoading={isLoading}
          error={error}
        />
      );

    case "fallback_perguntas":
      return (
        <TelaPerguntasFallback
          motivo={etapa.motivo}
          onSubmit={handleFallbackPerguntas}
          isLoading={isLoading}
          error={error}
        />
      );

    case "revisao_ia":
      return (
        <TelaRevisaoIa
          logId={etapa.logId}
          dadosFactuais={dadosFactuais!}
          estimativas={etapa.estimativas}
          canaisSugeridos={etapa.canaisSugeridos}
          onConfirmar={handleConfirmarIa}
          isLoading={isLoading}
          error={error}
        />
      );

    case "revisao_determ":
      return (
        <TelaRevisaoDeterministica
          inferredData={etapa.inferredData}
          onSubmit={handleSalvarDeterm}
          isLoading={isLoading}
          error={error}
        />
      );
  }
}
