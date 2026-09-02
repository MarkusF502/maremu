"use client";

import { useState } from "react";
import { ChevronRight, HelpCircle } from "lucide-react";
import CurrencyInput from "@/src/components/CurrencyInput";

// ── Tipos ────────────────────────────────────────────────────────────────
// Espelha a estrutura de pendência devolvida por
// POST /api/loja/onboarding/analisar-texto e /responder-pendencias
// (Spec-Extracao-Assertiva-Onboarding-Maremu §8).

export type Pendencia = {
  id: string;
  tipo: "confirmacao_binaria" | "confirmacao_valor_sugerido" | "confirmacao_agregada" | "confirmacao_valor_faixa";
  pergunta: string;
  opcoes?: string[];
  valor_sugerido?: number;
  depende_de: string | null;
};

type Resposta = { id: string; resposta: string | number };

export default function PendenciaWizardModal({
  pendencias,
  onConcluir,
  onRevisarManualmente,
  isLoading,
}: {
  pendencias: Pendencia[];
  onConcluir: (respostas: Resposta[]) => void;
  onRevisarManualmente: () => void;
  isLoading: boolean;
}) {
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [valorLivre, setValorLivre] = useState("");

  const pendencia = pendencias[indice];
  if (!pendencia) return null;

  const responder = (resposta: string | number) => {
    const novasRespostas = [...respostas, { id: pendencia.id, resposta }];

    if (indice + 1 < pendencias.length) {
      setRespostas(novasRespostas);
      setValorLivre("");
      setIndice(indice + 1);
    } else {
      onConcluir(novasRespostas);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] uppercase tracking-wide mb-3">
          <HelpCircle size={14} />
          Só mais um detalhe ({indice + 1}/{pendencias.length})
        </div>

        <p className="text-sm text-[#1E293B] font-medium leading-relaxed mb-5">{pendencia.pergunta}</p>

        {pendencia.tipo === "confirmacao_binaria" && (
          <div className="flex flex-col gap-2">
            {(pendencia.opcoes ?? ["Não", "Sim"]).map((opcao, i) => (
              <button
                key={opcao}
                disabled={isLoading}
                onClick={() => responder(i === 0 ? "nao" : "sim")}
                className="w-full py-3 rounded-xl border border-slate-200 hover:border-[#2563EB] hover:bg-blue-50 text-sm font-semibold text-slate-700 hover:text-[#2563EB] transition-all disabled:opacity-50"
              >
                {opcao}
              </button>
            ))}
          </div>
        )}

        {pendencia.tipo === "confirmacao_valor_sugerido" && (
          <div className="flex flex-col gap-2">
            {(pendencia.opcoes ?? ["Sim, está certo", "Não, é diferente"]).map((opcao, i) => (
              <button
                key={opcao}
                disabled={isLoading}
                onClick={() => responder(i === 0 ? "confirmado" : "ajustar")}
                className="w-full py-3 rounded-xl border border-slate-200 hover:border-[#2563EB] hover:bg-blue-50 text-sm font-semibold text-slate-700 hover:text-[#2563EB] transition-all disabled:opacity-50"
              >
                {opcao}
              </button>
            ))}
          </div>
        )}

        {pendencia.tipo === "confirmacao_agregada" && (
          <div className="flex flex-col gap-2">
            <button
              disabled={isLoading}
              onClick={() => responder("confirmado")}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold transition-all disabled:opacity-50"
            >
              {pendencia.opcoes?.[0] ?? "Sim, é isso mesmo"}
            </button>
            <button
              disabled={isLoading}
              onClick={onRevisarManualmente}
              className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-600 transition-all disabled:opacity-50"
            >
              {pendencia.opcoes?.[1] ?? "Não, deixa eu revisar os valores"}
            </button>
          </div>
        )}

        {pendencia.tipo === "confirmacao_valor_faixa" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              responder(Number(valorLivre || 0));
            }}
            className="space-y-3"
          >
            {/* quantidade_vendida e volume_vendas_direto são contagens
                (peças/mês), não um valor monetário — usar CurrencyInput aqui
                interpretava os dígitos como centavos (ex: "200" virava
                R$ 2,00) e ainda exibia o prefixo "R$" para um campo que não
                é dinheiro. */}
            {pendencia.id === "quantidade_vendida" || pendencia.id === "volume_vendas_direto" ? (
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={valorLivre}
                onChange={(e) => setValorLivre(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-[#1E293B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
              />
            ) : pendencia.id === "margem_lucro_desejada" ? (
              // Campo percentual — mesmo range de OnboardingGuardrail::RANGES['margem_lucro_desejada'] (5–60%).
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={60}
                  step={1}
                  value={valorLivre}
                  onChange={(e) => setValorLivre(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 pr-9 rounded-lg border border-slate-200 bg-white text-sm text-[#1E293B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                <CurrencyInput
                  value={valorLivre}
                  onChange={setValorLivre}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-[#1E293B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading || valorLivre.trim() === ""}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
