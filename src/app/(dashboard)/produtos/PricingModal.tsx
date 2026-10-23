"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import CurrencyInput from "@/src/components/CurrencyInput";
import PosicaoMercado from "@/src/components/PosicaoMercado";
import DiagnosticoMercado from "@/src/components/DiagnosticoMercado";
import {
  descricaoFaixaMercado,
  posicaoPrecoMercado,
  type ComposicaoPreco,
  type FaixaMercadoDisponivel,
} from "@/src/lib/mercado";

export type CenarioIA = {
  id: "cenario_1" | "cenario_2" | "cenario_3";
  tipo: "liquidacao" | "ideal" | "alta_demanda";
  preco_sugerido: number;
  explicacao: string;
};

const TIPO_LABEL: Record<CenarioIA["tipo"], string> = {
  liquidacao: "Liquidação",
  ideal: "Venda ideal",
  alta_demanda: "Alta demanda",
};

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Modal de precificação com IA — cadastro de produto.
 * Reimplementação do protótipo "Modal de Precificação" (Claude Design)
 * usando o sistema de movimento mm-* já existente em globals.css.
 */
export default function PricingModal({
  composicao,
  faixaMercado,
  precoPiso,
  cenarios,
  cenarioEscolhido,
  loading,
  preco,
  error,
  saving,
  onPickCenario,
  onPrecoChange,
  onRecarregar,
  onSalvar,
  close,
}: {
  composicao?: ComposicaoPreco | null;
  faixaMercado: FaixaMercadoDisponivel | null;
  precoPiso: string;
  cenarios: CenarioIA[];
  cenarioEscolhido: string;
  loading: boolean;
  preco: string;
  error: string;
  saving: boolean;
  onPickCenario: (cenario: CenarioIA) => void;
  onPrecoChange: (valor: string) => void;
  onRecarregar: () => void;
  onSalvar: () => void;
  close: () => void;
}) {
  const posicaoManual = faixaMercado
    ? posicaoPrecoMercado(preco, faixaMercado)
    : null;

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflowAnterior; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={close}
        className="mm-fade absolute inset-0 bg-slate-900/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
        className="mm-dialog-in relative flex max-h-[calc(100dvh-32px)] min-h-0 w-full max-w-[490px] flex-col overflow-hidden rounded-[20px] bg-white text-slate-900 shadow-[0_44px_90px_-30px_rgba(15,23,42,.55)]"
      >
        <header className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
          <div className="mb-1.5 flex items-start justify-between">
            <h2 id="pricing-modal-title" className="text-[19px] font-extrabold">Ajustar preço de venda</h2>
            <button
              type="button"
              aria-label="Fechar"
              onClick={close}
              className="mm-hover flex size-8 items-center justify-center rounded-[9px] text-slate-500 hover:bg-slate-100"
            >
              <X size={17} strokeWidth={1.8} />
            </button>
          </div>
          <p className="text-[13.5px] text-slate-500">
            Preço piso R$ {precoPiso} calculado pelo sistema. Escolha um cenário da IA
            ou defina manualmente.
          </p>
          <div aria-live="polite" aria-atomic="true">
            {!loading && faixaMercado && (
              <p className="mm-fade mt-4 text-[12.5px] leading-relaxed text-slate-500">
                {descricaoFaixaMercado(faixaMercado)}
              </p>
            )}
          </div>
        </header>

        <div
          role="region"
          aria-label="Cenários de preço"
          tabIndex={0}
          className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0080ff] sm:px-7"
        >
          <DiagnosticoMercado
            faixa={loading ? null : faixaMercado}
            composicao={composicao ?? null}
            cenarios={cenarios}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-9">
              <div className="mm-stagger flex gap-2">
                {["#1a3673", "#2563eb", "#0080ff", "#6aa4f8"].map((color, i) => (
                  <i
                    key={color}
                    style={{ background: color, ["--mm-i" as string]: i }}
                    className="mm-dot block size-3.5 rounded"
                  />
                ))}
              </div>
              <p className="max-w-[270px] text-center text-[13px] text-slate-500">
                Aguarde enquanto a IA calcula o preço ideal do seu produto…
              </p>
            </div>
          ) : (
            <div className="mm-stagger flex flex-col gap-2.5">
              {cenarios.map((cenario, i) => {
                const active = cenarioEscolhido === cenario.id;
                const posicao = faixaMercado
                  ? posicaoPrecoMercado(cenario.preco_sugerido, faixaMercado)
                  : null;
                return (
                  <button
                    key={cenario.id}
                    type="button"
                    onClick={() => onPickCenario(cenario)}
                    style={{ ["--mm-i" as string]: i }}
                    className={`mm-rise-in mm-hover shrink-0 rounded-[13px] border-[1.5px] p-4 text-left ${
                      active
                        ? "border-[#0080ff] bg-[#f5faff]"
                        : "border-[#e9eff8] bg-[#fbfcfe] hover:border-[#c9dcf7]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm font-bold text-slate-900">
                        {TIPO_LABEL[cenario.tipo]}
                      </span>
                      <span
                        className={`text-[15px] font-extrabold tabular-nums ${
                          active ? "text-[#0080ff]" : "text-slate-900"
                        }`}
                      >
                        R$ {formatBRL(cenario.preco_sugerido)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
                      {cenario.explicacao}
                    </p>
                    {posicao && (
                      <div className="mt-2"><PosicaoMercado posicao={posicao} /></div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!loading && (
          <footer className="shrink-0 border-t border-slate-100 px-5 pb-5 pt-4 sm:px-7 sm:pb-7">
            {error && (
              <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <label className="block text-[12.5px] font-bold text-slate-600">
              {cenarios.length > 0 ? "Ou defina manualmente" : "Preço de venda"}
              <div className="mm-hover mt-2 flex h-[46px] items-center gap-1.5 rounded-xl border border-[#e0e7f3] bg-[#fbfcfe] px-3.5 focus-within:border-[#0080ff] focus-within:shadow-[0_0_0_3px_rgba(0,128,255,.14)]">
                <span className="text-[13px] font-bold text-slate-400">R$</span>
                <CurrencyInput
                  autoFocus={cenarios.length === 0}
                  required
                  value={preco}
                  onChange={onPrecoChange}
                  placeholder="0,00"
                  className="w-full flex-1 border-none bg-transparent text-[16px] font-extrabold text-slate-900 outline-none"
                />
              </div>
            </label>

            <div aria-live="polite" aria-atomic="true">
              {posicaoManual && (
                <div className="mt-2"><PosicaoMercado posicao={posicaoManual} /></div>
              )}
            </div>

            <button
              type="button"
              onClick={onSalvar}
              disabled={saving}
              className="mm-hover mt-[18px] w-full rounded-xl bg-[#0080ff] py-3.5 text-center text-[14.5px] font-bold text-white hover:bg-[#1a3673] disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar preço e continuar"}
            </button>
            <button
              type="button"
              onClick={onRecarregar}
              className="mm-hover mt-3 w-full text-center text-[12.5px] font-semibold text-slate-400 hover:text-[#0080ff]"
            >
              Recalcular com a IA
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
