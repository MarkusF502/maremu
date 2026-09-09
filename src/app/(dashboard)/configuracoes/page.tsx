"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Save,
  Store,
  DollarSign,
  Users,
  RefreshCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bell,
  HelpCircle,
  X,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { HELP_ARTICLES } from "./help";
import CurrencyInput from "@/src/components/CurrencyInput";

// ─── Tipos ────────────────────────────────────────────────────────────────

type Canal = {
  canal: string;
  taxa_percentual: number;
  taxa_origem: "estimado_pelo_sistema" | "confirmado_pelo_lojista" | "editado_pelo_lojista";
};

type LojaConfig = {
  nome: string;
  faturamento_medio_mensal: number;
  custo_fixo_mensal: number;
  custo_fixo_origem: string;
  volume_vendas_esperado: number;
  margem_lucro_desejada: number;
  posicionamento: "popular" | "medio" | "premium";
  regime_tributario: "simples_nacional" | "lucro_presumido" | "lucro_real";
  aliquota_efetiva: number;
  aliquota_origem: string;
  estoque_minimo_alerta_global: number;
};

type ConfigState = {
  loja: LojaConfig;
  canais: Canal[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────

const CANAL_LABELS: Record<string, string> = {
  loja_fisica:        "Loja Física",
  instagram_whatsapp: "Instagram / WhatsApp",
  marketplace:        "Marketplace (Shopee, ML)",
};

const REGIME_LABELS: Record<string, string> = {
  simples_nacional: "Simples Nacional",
  lucro_presumido:  "Lucro Presumido",
  lucro_real:       "Lucro Real",
};

const POSICIONAMENTO_LABELS: Record<string, string> = {
  popular: "Popular",
  medio:   "Médio",
  premium: "Premium",
};

const ORIGEM: Record<string, { label: string; bg: string; fg: string; bd: string }> = {
  estimado_pelo_sistema:   { label: "Estimado",   bg: "#fff8ea", fg: "#b45309", bd: "#f5e0bd" },
  confirmado_pelo_lojista: { label: "Confirmado", bg: "#eafaf1", fg: "#047857", bd: "#c9ecd9" },
  editado_pelo_lojista:    { label: "Editado",    bg: "#eef4ff", fg: "#1d4ed8", bd: "#cfe0f8" },
};

const TOOLTIP_ESTOQUE_MINIMO =
  "Quando o estoque de uma variante (tamanho/cor) cair abaixo desse número, o sistema exibe um alerta crítico.";

function pct(val: number) {
  return (val * 100).toFixed(1);
}

function brl(val: number) {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function OrigemBadge({ origem }: { origem: string }) {
  const o = ORIGEM[origem] ?? ORIGEM.estimado_pelo_sistema;
  return (
    <span
      className="rounded-full px-2 py-0.75 text-[10px] font-bold"
      style={{ background: o.bg, color: o.fg, border: `1px solid ${o.bd}` }}
    >
      {o.label}
    </span>
  );
}

function EntenderButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mm-hover flex items-center gap-1.25 rounded-full bg-[#eef4ff] px-2.25 py-0.75 text-[11.5px] font-bold text-[#0080ff] hover:bg-[#dfeaff]"
    >
      <HelpCircle size={13} strokeWidth={1.8} />
      Entender
    </button>
  );
}

// ─── Componentes base ─────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  icon: Icon,
  open,
  onToggle,
  index,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mm-rise-in overflow-hidden rounded-2xl border border-[#e4eaf4] bg-white" style={{ '--mm-i': index } as React.CSSProperties}>
      <button
        type="button"
        onClick={onToggle}
        className="mm-hover flex w-full items-start gap-3 px-5.5 py-4.75 text-left hover:bg-[#fafbfe]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef4ff] text-[#1a3673]">
          <Icon size={16} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <p className="text-[14.5px] font-bold text-[#0f172a]">{title}</p>
          <p className="mt-0.75 text-[12.5px] text-[#8494ad]">{description}</p>
        </div>
        <span className="ml-auto shrink-0 text-[#94a3b8]">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div className="mm-rise-in border-t border-[#f2f5fa] px-5.5 pb-5.5 pt-4.5">
          {children}
        </div>
      )}
    </div>
  );
}

function FieldLabel({
  label,
  origem,
  helpKey,
  onOpenHelp,
}: {
  label: string;
  origem?: string;
  helpKey?: string;
  onOpenHelp?: (key: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#8494ad]">{label}</span>
      <div className="flex items-center gap-1.5">
        {origem && <OrigemBadge origem={origem} />}
        {helpKey && onOpenHelp && <EntenderButton onClick={() => onOpenHelp(helpKey)} />}
      </div>
    </div>
  );
}

const fieldInputClass =
  "mt-2 flex h-10.5 items-center gap-1.75 rounded-[10px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.25 focus-within:border-[#0080ff] focus-within:shadow-[0_0_0_3px_rgba(0,128,255,.14)]";
const bareInputClass =
  "w-full flex-1 border-none bg-transparent text-sm font-bold text-[#0f172a] outline-none";
const selectClass =
  "mt-2 h-10.5 w-full cursor-pointer rounded-[10px] border border-[#e0e7f3] bg-[#fbfcfe] px-2.75 text-[13.5px] font-semibold text-[#0f172a] outline-none focus:border-[#0080ff]";

// ─── Painel de ajuda (slide-over) ──────────────────────────────────────────

function PainelDeAjuda({ artigoKey, onClose }: { artigoKey: string | null; onClose: () => void }) {
  if (!artigoKey) return null;
  const artigo = HELP_ARTICLES[artigoKey];
  if (!artigo) return null;

  return createPortal(
    <>
      <div
        role="presentation"
        onClick={onClose}
        className="mm-fade fixed inset-0 z-[60] bg-[rgba(15,23,42,.4)] backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="mm-slide-right fixed inset-y-0 right-0 z-[61] w-103 overflow-y-auto border-l border-[#e4eaf4] bg-white px-7.5 pb-10 pt-6.5 shadow-[-24px_0_60px_-30px_rgba(15,23,42,.45)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="mm-hover inline-flex items-center gap-2 text-[13px] font-semibold text-[#8494ad] hover:text-[#0f172a]"
        >
          <X size={16} strokeWidth={1.8} />
          Fechar ajuda
        </button>

        <h2 className="mb-6.5 mt-6.5 text-[23px] font-extrabold tracking-tight text-[#0f172a]">{artigo.titulo}</h2>

        <div className="flex flex-col gap-6.5">
          <section>
            <div className="mb-2.75 flex items-center gap-2.25">
              <i className="block h-3.75 w-1.25 rounded-[3px] bg-[#0080ff]" />
              <h3 className="text-xs font-extrabold uppercase tracking-[.09em] text-[#0f172a]">O que é?</h3>
            </div>
            <p className="text-[13.5px] leading-relaxed text-[#475569]">{artigo.o_que_e}</p>
          </section>

          <section className="rounded-[14px] border border-[#e2ebfa] bg-[#f5f8fe] px-5 py-4.5">
            <h3 className="mb-2.25 text-xs font-extrabold uppercase tracking-[.09em] text-[#1a3673]">Como descobrir?</h3>
            <p className="text-[13.5px] leading-relaxed text-[#1e3a6f]">{artigo.como_descobrir}</p>
          </section>

          <section>
            <div className="mb-2.75 flex items-center gap-2.25">
              <i className="block h-3.75 w-1.25 rounded-[3px] bg-[#cbd5e1]" />
              <h3 className="text-xs font-extrabold uppercase tracking-[.09em] text-[#64748b]">Por que informamos isso?</h3>
            </div>
            <p className="text-[13.5px] leading-relaxed text-[#475569]">{artigo.por_que_importa}</p>
          </section>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ─── Barra de resumo (topo da página, em fluxo normal — não fixa) ─────────

function BarraResumo({ loja }: { loja: LojaConfig }) {
  return (
    <div className="flex flex-wrap items-center gap-7.5 border-b border-[#e4eaf4] bg-white/90 px-8.5 py-3.25 backdrop-blur">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Custo fixo / peça</p>
        <p className="mt-1 text-sm font-extrabold text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {loja.volume_vendas_esperado > 0 ? `R$ ${brl(loja.custo_fixo_mensal / loja.volume_vendas_esperado)}` : "—"}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Margem alvo</p>
        <p className="mt-1 text-sm font-extrabold text-[#0080ff]" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct(loja.margem_lucro_desejada)}%</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Imposto</p>
        <p className="mt-1 text-sm font-extrabold text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{(loja.aliquota_efetiva * 100).toFixed(1)}%</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Posição</p>
        <p className="mt-1 text-sm font-extrabold text-[#0f172a]">{POSICIONAMENTO_LABELS[loja.posicionamento]}</p>
      </div>
      <p className="ml-auto text-xs text-[#94a3b8]">Salve para atualizar o preço piso</p>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [original, setOriginal] = useState<ConfigState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [artigoAberto, setArtigoAberto] = useState<string | null>(null);

  const [secAberta, setSecAberta] = useState({ identidade: true, financeiro: true, canais: true, alertas: false });
  const toggleSecao = (secao: keyof typeof secAberta) =>
    setSecAberta((atual) => ({ ...atual, [secao]: !atual[secao] }));

  useEffect(() => {
    apiFetch("/api/loja/configuracoes")
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro ao carregar configurações.");
        const data: ConfigState = await res.json();
        setConfig(data);
        setOriginal(JSON.parse(JSON.stringify(data)));
      })
      .catch(() => setLoadError("Não foi possível carregar as configurações da loja."));
  }, []);

  const setLoja = (patch: Partial<LojaConfig>) =>
    setConfig((prev) => (prev ? { ...prev, loja: { ...prev.loja, ...patch } } : prev));

  const setCanal = (canal: string, taxa: number) =>
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            canais: prev.canais.map((c) =>
              c.canal === canal ? { ...c, taxa_percentual: taxa, taxa_origem: "editado_pelo_lojista" } : c,
            ),
          }
        : prev,
    );

  const hasChanges = config && original ? JSON.stringify(config) !== JSON.stringify(original) : false;

  const handleSalvar = async () => {
    if (!config) return;
    setSaveStatus("saving");
    setSaveError("");

    try {
      const res = await apiFetch("/api/loja/configuracoes", {
        method: "PUT",
        body: JSON.stringify({
          nome:                          config.loja.nome,
          posicionamento:                config.loja.posicionamento,
          regime_tributario:             config.loja.regime_tributario,
          faturamento_medio_mensal:      config.loja.faturamento_medio_mensal,
          custo_fixo_mensal:             config.loja.custo_fixo_mensal,
          custo_fixo_origem:             config.loja.custo_fixo_origem,
          margem_lucro_desejada:         config.loja.margem_lucro_desejada,
          aliquota_efetiva:              config.loja.aliquota_efetiva,
          aliquota_origem:               config.loja.aliquota_origem,
          volume_vendas_esperado:        config.loja.volume_vendas_esperado,
          estoque_minimo_alerta_global:  config.loja.estoque_minimo_alerta_global,
          canais:                        config.canais,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.message ?? "Erro ao salvar.");
        setSaveStatus("error");
        return;
      }

      setOriginal(JSON.parse(JSON.stringify(config)));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveError("Erro de conexão com o servidor.");
      setSaveStatus("error");
    }
  };

  const handleDescartar = () => {
    if (original) setConfig(JSON.parse(JSON.stringify(original)));
    setSaveStatus("idle");
    setSaveError("");
  };

  if (!config && !loadError) {
    return (
      <div className="flex h-full items-center justify-center text-[#64748b]">
        <Loader2 size={26} className="mr-3 animate-spin text-[#0080ff]" />
        Carregando configurações…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="text-sm text-[#64748b]">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mm-hover flex items-center gap-1.5 text-sm font-semibold text-[#0080ff] hover:text-[#1a3673]"
        >
          <RefreshCcw size={14} /> Tentar novamente
        </button>
      </div>
    );
  }

  const loja = config!.loja;

  return (
    <div className="mm-screen-in">
      <BarraResumo loja={loja} />

      <div className="max-w-190 px-8.5 pb-15 pt-7.5">
        <div className="mb-5.5">
          <p className="text-xs font-bold uppercase tracking-[.09em] text-[#0080ff]">Sua loja</p>
          <h1 className="mt-1.5 text-[29px] font-extrabold tracking-tight text-[#0f172a]">Configurações</h1>
          <p className="mt-1.5 max-w-130 text-sm text-[#64748b]">
            Atualize os dados da sua loja. Qualquer alteração aqui recalcula o preço piso dos seus produtos automaticamente.
          </p>
        </div>

        <div className="flex flex-col gap-3">

          <SectionCard
            title="Identidade da loja"
            description="Nome, posicionamento de mercado e regime tributário"
            icon={Store}
            open={secAberta.identidade}
            onToggle={() => toggleSecao("identidade")}
            index={0}
          >
            <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#8494ad]">
              Nome da loja
              <input
                value={loja.nome}
                onChange={(e) => setLoja({ nome: e.target.value })}
                placeholder="Ex: Maremu Modas"
                className="mt-2 h-10.5 w-full rounded-[10px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.25 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff] focus:shadow-[0_0_0_3px_rgba(0,128,255,.14)]"
              />
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3.5">
              <div>
                <FieldLabel label="Posicionamento" helpKey="posicionamento_mercado" onOpenHelp={setArtigoAberto} />
                <select
                  value={loja.posicionamento}
                  onChange={(e) => setLoja({ posicionamento: e.target.value as LojaConfig["posicionamento"] })}
                  className={selectClass}
                >
                  <option value="popular">Popular — volume e preço acessível</option>
                  <option value="medio">Médio — equilíbrio qualidade/preço</option>
                  <option value="premium">Premium — exclusividade e margem alta</option>
                </select>
              </div>
              <div>
                <FieldLabel label="Regime tributário" helpKey="regime_tributario" onOpenHelp={setArtigoAberto} />
                <select
                  value={loja.regime_tributario}
                  onChange={(e) => setLoja({ regime_tributario: e.target.value as LojaConfig["regime_tributario"] })}
                  className={selectClass}
                >
                  <option value="simples_nacional">Simples Nacional</option>
                  <option value="lucro_presumido">Lucro Presumido</option>
                  <option value="lucro_real">Lucro Real</option>
                </select>
              </div>
            </div>

            {loja.regime_tributario !== "simples_nacional" && (
              <div className="mm-rise-in mt-4 flex gap-2.75 rounded-xl border border-[#fbe9cf] bg-[#fff9f0] px-4 py-3.5">
                <AlertTriangle size={16} strokeWidth={1.7} className="mt-0.5 shrink-0 text-[#d97706]" />
                <p className="text-[12.5px] leading-relaxed text-[#92400e]">
                  <strong>Confirme a alíquota com seu contador.</strong> Para {REGIME_LABELS[loja.regime_tributario]}, os impostos variam conforme o lucro apurado.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Dados financeiros"
            description="Valores que compõem o cálculo do preço piso de cada produto"
            icon={DollarSign}
            open={secAberta.financeiro}
            onToggle={() => toggleSecao("financeiro")}
            index={1}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Custo fixo mensal" origem={loja.custo_fixo_origem} helpKey="custo_fixo_mensal" onOpenHelp={setArtigoAberto} />
                <div className={fieldInputClass}>
                  <span className="text-[12.5px] font-bold text-[#94a3b8]">R$</span>
                  <CurrencyInput
                    value={String(loja.custo_fixo_mensal)}
                    onChange={(value) => setLoja({ custo_fixo_mensal: Number(value || 0), custo_fixo_origem: "editado_pelo_lojista" })}
                    className={bareInputClass}
                  />
                </div>
              </div>

              <div>
                <FieldLabel label="Margem desejada" helpKey="margem_lucro_desejada" onOpenHelp={setArtigoAberto} />
                <div className={fieldInputClass}>
                  <input
                    type="number"
                    step={1}
                    min={1}
                    max={99}
                    value={Number(pct(loja.margem_lucro_desejada))}
                    onChange={(e) => setLoja({ margem_lucro_desejada: Number(e.target.value) / 100 })}
                    className={bareInputClass}
                  />
                  <span className="text-[12.5px] font-bold text-[#94a3b8]">%</span>
                </div>
              </div>

              <div>
                <FieldLabel label="Alíquota de imposto" origem={loja.aliquota_origem} helpKey="aliquota_efetiva" onOpenHelp={setArtigoAberto} />
                <div className={fieldInputClass}>
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    max={99}
                    value={Number((loja.aliquota_efetiva * 100).toFixed(1))}
                    onChange={(e) => setLoja({ aliquota_efetiva: Number(e.target.value) / 100, aliquota_origem: "editado_pelo_lojista" })}
                    className={bareInputClass}
                  />
                  <span className="text-[12.5px] font-bold text-[#94a3b8]">%</span>
                </div>
                <p className="mt-1.75 text-[11.5px] text-[#94a3b8]">
                  Regime atual: <b className="text-[#475569]">{REGIME_LABELS[loja.regime_tributario]}</b>
                </p>
              </div>

              <div>
                <FieldLabel label="Volume esperado" helpKey="volume_vendas_esperado" onOpenHelp={setArtigoAberto} />
                <div className={fieldInputClass}>
                  <input
                    type="number"
                    step={1}
                    min={1}
                    value={loja.volume_vendas_esperado}
                    onChange={(e) => setLoja({ volume_vendas_esperado: Number(e.target.value) })}
                    className={bareInputClass}
                  />
                  <span className="text-[11.5px] font-semibold text-[#94a3b8]">peças/mês</span>
                </div>
              </div>

              <div className="col-span-2">
                <FieldLabel label="Faturamento médio mensal" helpKey="faturamento_medio_mensal" onOpenHelp={setArtigoAberto} />
                <div className={fieldInputClass}>
                  <span className="text-[12.5px] font-bold text-[#94a3b8]">R$</span>
                  <CurrencyInput
                    value={String(loja.faturamento_medio_mensal)}
                    onChange={(value) => setLoja({ faturamento_medio_mensal: Number(value || 0) })}
                    className={bareInputClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4.5 rounded-[13px] border border-[#e2ebfa] bg-[#f5f8fe] px-4.5 py-4">
              <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[.11em] text-[#8494ad]">Impacto estimado no preço piso</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[11.5px] text-[#94a3b8]">Custo fixo / peça</p>
                  <p className="mt-1.25 text-[15px] font-extrabold text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {loja.volume_vendas_esperado > 0 ? `R$ ${brl(loja.custo_fixo_mensal / loja.volume_vendas_esperado)}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-[#94a3b8]">Imposto</p>
                  <p className="mt-1.25 text-[15px] font-extrabold text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{(loja.aliquota_efetiva * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[11.5px] text-[#94a3b8]">Margem alvo</p>
                  <p className="mt-1.25 text-[15px] font-extrabold text-[#0080ff]" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct(loja.margem_lucro_desejada)}%</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Taxas dos canais de venda"
            description="Taxas de cartão e comissão de marketplace — entram no preço piso"
            icon={Users}
            open={secAberta.canais}
            onToggle={() => toggleSecao("canais")}
            index={2}
          >
            <div className="flex flex-col gap-2.5">
              {config!.canais.map((c) => (
                <div key={c.canal} className="mm-hover flex items-center gap-3.5 rounded-xl border border-[#eef2f8] bg-[#f8fafd] px-4 py-3.5 hover:border-[#cfe0f8]">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-[#0f172a]">{CANAL_LABELS[c.canal] ?? c.canal}</p>
                    <div className="mt-1.25 flex items-center gap-2">
                      <OrigemBadge origem={c.taxa_origem} />
                      <span className="text-[11.5px] text-[#94a3b8]">Taxa de comissão ou cartão</span>
                    </div>
                  </div>
                  <div className="ml-auto flex h-10 w-28 shrink-0 items-center gap-1.5 rounded-[10px] border border-[#e0e7f3] bg-white px-3">
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={99}
                      value={Number((c.taxa_percentual * 100).toFixed(1))}
                      onChange={(e) => setCanal(c.canal, Number(e.target.value) / 100)}
                      className="w-full flex-1 border-none bg-transparent text-right text-sm font-bold text-[#0f172a] outline-none"
                    />
                    <span className="text-[12.5px] font-bold text-[#94a3b8]">%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="max-w-107.5 text-[11.5px] text-[#94a3b8]">
                Para adicionar ou remover canais, entre em contato com o suporte — essa funcionalidade estará disponível em breve.
              </p>
              <EntenderButton onClick={() => setArtigoAberto("taxa_canais_venda")} />
            </div>
          </SectionCard>

          <SectionCard
            title="Alertas de estoque"
            description="Define quando o sistema exibe alertas críticos no relatório"
            icon={Bell}
            open={secAberta.alertas}
            onToggle={() => toggleSecao("alertas")}
            index={3}
          >
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#8494ad]">Estoque mínimo por variante</span>
            <div className="mt-2 flex h-10.5 max-w-70 items-center gap-1.75 rounded-[10px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.25 focus-within:border-[#0080ff]">
              <input
                type="number"
                step={1}
                min={1}
                value={loja.estoque_minimo_alerta_global}
                onChange={(e) => setLoja({ estoque_minimo_alerta_global: Number(e.target.value) })}
                title={TOOLTIP_ESTOQUE_MINIMO}
                className={bareInputClass}
              />
              <span className="text-[11.5px] font-semibold text-[#94a3b8]">unidades</span>
            </div>
            <p className="mt-2.25 max-w-130 text-[11.5px] leading-relaxed text-[#94a3b8]">
              Alerta disparado quando qualquer tamanho/cor de um produto cair abaixo desse número. O padrão é 3 unidades.
            </p>
            <div className="mt-4 rounded-xl border border-[#e2ebfa] bg-[#f5f8fe] px-4 py-3.5">
              <p className="text-[12.5px] leading-relaxed text-[#334155]">
                <strong className="text-[#1a3673]">Como funciona:</strong> cada variante de produto (ex: Blusa Floral — P, Rosa) tem seu próprio limiar. Você pode sobrescrever esse padrão produto a produto na tela de produtos.
              </p>
            </div>
          </SectionCard>
        </div>

        {saveError && (
          <div className="mm-rise-in mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle size={15} className="shrink-0" />
            {saveError}
          </div>
        )}

        {hasChanges && (
          <div className="mm-rise-in sticky bottom-5 mt-4.5 flex items-center justify-between gap-4 rounded-[14px] border border-[#dfe6f2] bg-white px-5 py-3.75 shadow-[0_18px_40px_-22px_rgba(15,23,42,.55)]">
            {saveStatus === "saved" ? (
              <p className="flex items-center gap-2 text-[13.5px] font-bold text-[#047857]">
                <CheckCircle2 size={16} />
                Salvo com sucesso
              </p>
            ) : (
              <p className="text-[13.5px] text-[#64748b]">Há alterações não salvas</p>
            )}
            <div className="ml-auto flex gap-2.5">
              <button
                type="button"
                onClick={handleDescartar}
                disabled={saveStatus === "saving"}
                className="mm-hover rounded-[11px] border border-[#dfe6f2] px-4.5 py-2.75 text-[13.5px] font-bold text-[#475569] hover:bg-[#f6f8fc] disabled:opacity-50"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleSalvar}
                disabled={saveStatus === "saving"}
                className="mm-hover flex items-center gap-2 rounded-[11px] bg-[#0080ff] px-5 py-2.75 text-[13.5px] font-bold text-white hover:bg-[#1a3673] disabled:opacity-50"
              >
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Salvando…
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <PainelDeAjuda artigoKey={artigoAberto} onClose={() => setArtigoAberto(null)} />
    </div>
  );
}
