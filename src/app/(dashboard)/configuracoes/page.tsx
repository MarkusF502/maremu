"use client";

import { useState, useEffect } from "react";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  Save,
  Store,
  Percent,
  DollarSign,
  ShoppingBag,
  BarChart2,
  Users,
  RefreshCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bell,
  Package,
  HelpCircle,
  X,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { HELP_ARTICLES } from "./help";

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

// Tooltips simples (para o que não precisa de um artigo inteiro)
const TOOLTIPS: Record<string, string> = {
  faturamento_medio_mensal:
    "Valor de referência para estimar porte e tributação. Não entra diretamente no cálculo do preço.",
  estoque_minimo_alerta_global:
    "Quando o estoque de uma variante (tamanho/cor) cair abaixo desse número, o sistema exibe um alerta crítico.",
};

function pct(val: number) {
  return (val * 100).toFixed(1);
}

function brl(val: number) {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function origemBadge(origem: string) {
  const map: Record<string, { label: string; color: string }> = {
    estimado_pelo_sistema:    { label: "Estimado",  color: "bg-amber-50 text-amber-600 border-amber-200" },
    confirmado_pelo_lojista:  { label: "Confirmado", color: "bg-green-50 text-green-600 border-green-200" },
    editado_pelo_lojista:     { label: "Editado",   color: "bg-blue-50 text-blue-600 border-blue-200" },
  };
  const m = map[origem] ?? map["estimado_pelo_sistema"];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.color}`}>
      {m.label}
    </span>
  );
}

// ─── Componentes base ─────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
  icon: Icon,
  open,
  onToggle,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 text-left group"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] shrink-0">
          <Icon size={15} />
        </div>
        <div>
          <p className="text-sm font-bold text-[#1E293B] group-hover:text-[#2563EB] transition-colors">
            {title}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      {open ? (
        <ChevronUp size={16} className="text-slate-400 shrink-0" />
      ) : (
        <ChevronDown size={16} className="text-slate-400 shrink-0" />
      )}
    </button>
  );
}

function ConfigField({
  label,
  tooltip,
  helpArticleKey,
  onOpenHelp,
  icon: Icon,
  origem,
  children,
}: {
  label: string;
  tooltip?: string;
  helpArticleKey?: string;
  onOpenHelp?: (key: string) => void;
  icon?: React.ElementType;
  origem?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {Icon && <Icon size={12} className="text-[#2563EB]" />}
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {origem && origemBadge(origem)}
          
          {/* Se tiver um artigo de ajuda, exibe um botão clicável */}
          {helpArticleKey && onOpenHelp && (
            <button
              type="button"
              onClick={() => onOpenHelp(helpArticleKey)}
              className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-full font-medium transition-colors"
            >
              <HelpCircle size={13} />
              Entender
            </button>
          )}

          {/* Se tiver apenas tooltip simples, exibe no hover */}
          {!helpArticleKey && tooltip && (
            <span className="group relative cursor-pointer">
              <Info size={13} className="text-slate-300 hover:text-slate-500 transition-colors" />
              <span className="pointer-events-none absolute bottom-full right-0 mb-2 w-56 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-20 leading-relaxed">
                {tooltip}
              </span>
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Componente Painel Lateral (Slide-over) ───────────────────────────────

function PainelDeAjuda({ artigoKey, onClose }: { artigoKey: string | null; onClose: () => void }) {
  if (!artigoKey) return null;
  
  const artigo = HELP_ARTICLES[artigoKey];
  if (!artigo) return null;

  return (
    <>
      {/* Overlay escuro de fundo */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Painel deslizando da direita */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 p-6 sm:p-8 overflow-y-auto transform transition-transform duration-300 ease-in-out border-l border-slate-200 animate-in slide-in-from-right-8">
        <button 
          onClick={onClose} 
          className="flex items-center gap-2 mb-8 text-sm font-medium text-slate-400 hover:text-[#1E293B] transition-colors"
        >
           <X size={18} /> Fechar ajuda
        </button>
        
        <h2 className="text-2xl font-bold text-[#1E293B] mb-8">{artigo.titulo}</h2>
        
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-[#2563EB] rounded-full"></div>
              <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">O que é?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{artigo.o_que_e}</p>
          </section>
          
          <section className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Como descobrir?</h3>
            <p className="text-sm text-blue-900 leading-relaxed">{artigo.como_descobrir}</p>
          </section>
          
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Por que informamos isso?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{artigo.por_que_importa}</p>
          </section>
        </div>
      </div>
    </>
  );
}

// ─── Constantes de Estilo ─────────────────────────────────────────────────

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-[#1E293B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all";

const selectClass =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-[#1E293B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all";

// ─── Seções da página ─────────────────────────────────────────────────────

function SecaoIdentidade({
  loja,
  onChange,
  onOpenHelp,
}: {
  loja: LojaConfig;
  onChange: (patch: Partial<LojaConfig>) => void;
  onOpenHelp: (key: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5">
        <SectionHeader
          title="Identidade da Loja"
          description="Nome, posicionamento de mercado e regime tributário"
          icon={Store}
          open={open}
          onToggle={() => setOpen(!open)}
        />
      </div>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-50 pt-5 space-y-4">
          <ConfigField label="Nome da loja">
            <input
              type="text"
              value={loja.nome}
              onChange={(e) => onChange({ nome: e.target.value })}
              placeholder="Ex: Maremu Modas"
              className={inputClass}
            />
          </ConfigField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ConfigField label="Posicionamento de mercado" icon={ShoppingBag} helpArticleKey="posicionamento_mercado" onOpenHelp={onOpenHelp}>
              <select
                value={loja.posicionamento}
                onChange={(e) =>
                  onChange({ posicionamento: e.target.value as LojaConfig["posicionamento"] })
                }
                className={selectClass}
              >
                <option value="popular">Popular — volume e preço acessível</option>
                <option value="medio">Médio — equilíbrio qualidade/preço</option>
                <option value="premium">Premium — exclusividade e margem alta</option>
              </select>
            </ConfigField>

            <ConfigField label="Regime tributário" icon={ShoppingBag} helpArticleKey="regime_tributario" onOpenHelp={onOpenHelp}>
  <select
    value={loja.regime_tributario}
    onChange={(e) =>
      onChange({ regime_tributario: e.target.value as LojaConfig["regime_tributario"] })
    }
    // A crase permite misturar a variável pronta com classes extras do Tailwind
    className={`${selectClass} mt-3`} 
  >
    <option value="simples_nacional">Simples Nacional</option>
    <option value="lucro_presumido">Lucro Presumido</option>
    <option value="lucro_real">Lucro Real</option>
  </select>
</ConfigField>
          </div>


          {loja.regime_tributario !== "simples_nacional" && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Confirme a alíquota com seu contador.</strong> Para{" "}
                {REGIME_LABELS[loja.regime_tributario]}, os impostos variam conforme o lucro
                apurado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SecaoFinanceiro({
  loja,
  onChange,
  onOpenHelp,
}: {
  loja: LojaConfig;
  onChange: (patch: Partial<LojaConfig>) => void;
  onOpenHelp: (key: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5">
        <SectionHeader
          title="Dados Financeiros"
          description="Valores que compõem o cálculo do preço piso de cada produto"
          icon={DollarSign}
          open={open}
          onToggle={() => setOpen(!open)}
        />
      </div>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-50 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ConfigField
              label="Custo fixo mensal"
              icon={DollarSign}
              helpArticleKey="custo_fixo_mensal"
              onOpenHelp={onOpenHelp}
              origem={loja.custo_fixo_origem}
            >
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={loja.custo_fixo_mensal}
                  onChange={(e) =>
                    onChange({
                      custo_fixo_mensal: Number(e.target.value),
                      custo_fixo_origem: "editado_pelo_lojista",
                    })
                  }
                  className={`${inputClass} pl-10`}
                />
              </div>
            </ConfigField>

            <ConfigField
              label="Margem de lucro desejada"
              icon={Percent}
              helpArticleKey="margem_lucro_desejada"
              onOpenHelp={onOpenHelp}
            >
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  value={Number(pct(loja.margem_lucro_desejada))}
                  onChange={(e) =>
                    onChange({ margem_lucro_desejada: Number(e.target.value) / 100 })
                  }
                  className={`${inputClass} pr-8`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
            </ConfigField>

            <ConfigField
              label="Alíquota de imposto"
              helpArticleKey="aliquota_efetiva"
              onOpenHelp={onOpenHelp}
              origem={loja.aliquota_origem}
            >
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="99"
                  value={Number((loja.aliquota_efetiva * 100).toFixed(1))}
                  onChange={(e) =>
                    onChange({
                      aliquota_efetiva: Number(e.target.value) / 100,
                      aliquota_origem: "editado_pelo_lojista",
                    })
                  }
                  className={`${inputClass} pr-8`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-400">
                Regime atual:{" "}
                <span className="font-medium">{REGIME_LABELS[loja.regime_tributario]}</span>
              </p>
            </ConfigField>

            <ConfigField
              label="Volume de vendas esperado"
              helpArticleKey="volume_vendas_esperado"
              onOpenHelp={onOpenHelp}
            >
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={loja.volume_vendas_esperado}
                  onChange={(e) =>
                    onChange({ volume_vendas_esperado: Number(e.target.value) })
                  }
                  className={`${inputClass} pr-16`}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-xs">
                  peças/mês
                </span>
              </div>
            </ConfigField>

            <ConfigField
              label="Faturamento médio mensal"
              icon={BarChart2}
              onOpenHelp={onOpenHelp}
              helpArticleKey="faturamento_medio_mensal"
              
            >
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={loja.faturamento_medio_mensal}
                  onChange={(e) =>
                    onChange({ faturamento_medio_mensal: Number(e.target.value) })
                  }
                  className={`${inputClass} pl-10`}
                />
              </div>
            </ConfigField>
          </div>

          {/* Mini resumo do impacto no preço piso */}
          <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Impacto estimado no preço piso
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-slate-400">Custo fixo / peça</p>
                <p className="text-sm font-bold text-[#1E293B]">
                  R${" "}
                  {loja.volume_vendas_esperado > 0
                    ? brl(loja.custo_fixo_mensal / loja.volume_vendas_esperado)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Imposto</p>
                <p className="text-sm font-bold text-[#1E293B]">
                  {(loja.aliquota_efetiva * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Margem alvo</p>
                <p className="text-sm font-bold text-[#1E293B]">
                  {pct(loja.margem_lucro_desejada)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SecaoCanais({
  canais,
  onChange,
}: {
  canais: Canal[];
  onChange: (canais: Canal[]) => void;
}) {
  const [open, setOpen] = useState(true);

  const setCanal = (canal: string, taxa: number) =>
    onChange(
      canais.map((c) =>
        c.canal === canal
          ? { ...c, taxa_percentual: taxa, taxa_origem: "editado_pelo_lojista" }
          : c
      )
    );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5">
        <SectionHeader
          title="Taxas dos Canais de Venda"
          description="Taxas de cartão e comissão de marketplace — entram no preço piso"
          icon={Users}
          open={open}
          onToggle={() => setOpen(!open)}
        />
      </div>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-50 pt-5 space-y-3">
          {canais.map((c) => (
            <div
              key={c.canal}
              className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1E293B]">
                  {CANAL_LABELS[c.canal] ?? c.canal}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {origemBadge(c.taxa_origem)}
                  <p className="text-xs text-slate-400">Taxa de comissão ou cartão</p>
                </div>
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

          <p className="text-xs text-slate-400 pt-1">
            Para adicionar ou remover canais, entre em contato com o suporte — essa funcionalidade
            estará disponível em breve.
          </p>
        </div>
      )}
    </div>
  );
}

function SecaoAlertas({
  loja,
  onChange,
}: {
  loja: LojaConfig;
  onChange: (patch: Partial<LojaConfig>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5">
        <SectionHeader
          title="Alertas de Estoque"
          description="Define quando o sistema exibe alertas críticos no relatório"
          icon={Bell}
          open={open}
          onToggle={() => setOpen(!open)}
        />
      </div>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-50 pt-5 space-y-4">
          <ConfigField
            label="Estoque mínimo por variante"
            icon={Package}
            tooltip={TOOLTIPS.estoque_minimo_alerta_global} // Mantido como tooltip simples
          >
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                value={loja.estoque_minimo_alerta_global}
                onChange={(e) =>
                  onChange({ estoque_minimo_alerta_global: Number(e.target.value) })
                }
                className={`${inputClass} pr-20`}
              />
              <span className="absolute right-3 top-2.5 text-slate-400 text-xs">
                unidades
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Alerta disparado quando qualquer tamanho/cor de um produto cair abaixo
              desse número. O padrão é 3 unidades.
            </p>
          </ConfigField>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Como funciona:</strong> cada variante de produto (ex: Blusa Floral — P, Rosa)
              tem seu próprio limiar. Você pode sobrescrever esse padrão produto a produto na tela
              de produtos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Barra de resumo sticky ───────────────────────────────────────────────

function BarraResumo({ loja }: { loja: LojaConfig }) {
  return (
    <div className="top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Custo fixo/peça</p>
            <p className="text-sm font-bold text-[#1E293B]">
              {loja.volume_vendas_esperado > 0
                ? `R$ ${brl(loja.custo_fixo_mensal / loja.volume_vendas_esperado)}`
                : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Margem alvo</p>
            <p className="text-sm font-bold text-[#2563EB]">{pct(loja.margem_lucro_desejada)}%</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Imposto</p>
            <p className="text-sm font-bold text-[#1E293B]">
              {(loja.aliquota_efetiva * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Posição</p>
            <p className="text-sm font-bold text-[#1E293B]">
              {POSICIONAMENTO_LABELS[loja.posicionamento]}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 hidden md:block">Salve para atualizar o preço piso</p>
      </div>
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
  
  // Estado que controla o artigo de ajuda aberto no Painel Lateral
  const [artigoAberto, setArtigoAberto] = useState<string | null>(null);

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
    setConfig((prev) =>
      prev ? { ...prev, loja: { ...prev.loja, ...patch } } : prev
    );

  const setCanais = (canais: Canal[]) =>
    setConfig((prev) => (prev ? { ...prev, canais } : prev));

  const hasChanges =
    config && original
      ? JSON.stringify(config) !== JSON.stringify(original)
      : false;

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

  // ── Loading ──
  if (!config && !loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-[#2563EB]" />
          <p className="text-sm">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  // ── Erro de carregamento ──
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={28} className="text-red-400" />
          <p className="text-sm text-slate-600">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 text-sm text-[#2563EB] hover:underline"
          >
            <RefreshCcw size={14} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 to-blue-50/20">
      <BarraResumo loja={config!.loja} />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1E293B]">Configurações</h1>
          <p className="text-sm text-slate-500 mt-1">
            Atualize os dados da sua loja. Qualquer alteração aqui recalcula o preço piso dos seus
            produtos automaticamente.
          </p>
        </div>

        {/* Passando o estado do artigo para a Seção Financeira */}
        <SecaoIdentidade loja={config!.loja} onChange={setLoja} onOpenHelp={setArtigoAberto} />
        <SecaoFinanceiro loja={config!.loja} onChange={setLoja} onOpenHelp={setArtigoAberto} />
        <SecaoCanais canais={config!.canais} onChange={setCanais} />
        <SecaoAlertas loja={config!.loja} onChange={setLoja} />

        {saveError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            <AlertTriangle size={15} className="shrink-0" />
            {saveError}
          </div>
        )}

        <div
          className={`sticky bottom-4 transition-all duration-300 ${
            hasChanges ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              {saveStatus === "saved" ? (
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <CheckCircle2 size={15} /> Salvo com sucesso
                </span>
              ) : (
                "Há alterações não salvas"
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDescartar}
                disabled={saveStatus === "saving"}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleSalvar}
                disabled={saveStatus === "saving"}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-md shadow-[#2563EB]/20 transition-all disabled:opacity-50"
              >
                {saveStatus === "saving" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
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
        </div>

        <div className="h-6" />
      </div>

      {/* Renderização do Painel Lateral */}
      <PainelDeAjuda 
        artigoKey={artigoAberto} 
        onClose={() => setArtigoAberto(null)} 
      />
    </div>
  );
}