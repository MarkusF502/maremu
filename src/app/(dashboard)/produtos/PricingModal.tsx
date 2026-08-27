"use client";

import { X } from "lucide-react";
import CurrencyInput from "@/src/components/CurrencyInput";

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
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar"
        onClick={close}
        className="mm-fade absolute inset-0 bg-slate-900/45"
      />
      <div
        className="mm-pop-in-centered absolute left-1/2 top-1/2 w-[calc(100%-32px)] max-w-[490px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white p-7 text-slate-900 shadow-[0_44px_90px_-30px_rgba(15,23,42,.55)]"
      >
        <div className="mb-1.5 flex items-start justify-between">
          <h2 className="text-[19px] font-extrabold">Ajustar preço de venda</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={close}
            className="mm-hover flex size-8 items-center justify-center rounded-[9px] text-slate-500 hover:bg-slate-100"
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        </div>
        <p className="mb-5 text-[13.5px] text-slate-500">
          Preço piso R$ {precoPiso} calculado pelo sistema. Escolha um cenário da IA
          ou defina manualmente.
        </p>

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
          <>
            <div className="mm-stagger flex flex-col gap-2.5">
              {cenarios.map((cenario, i) => {
                const active = cenarioEscolhido === cenario.id;
                return (
                  <button
                    key={cenario.id}
                    type="button"
                    onClick={() => onPickCenario(cenario)}
                    style={{ ["--mm-i" as string]: i }}
                    className={`mm-rise-in mm-hover rounded-[13px] border-[1.5px] p-4 text-left ${
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
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <label className="mt-[18px] block text-[12.5px] font-bold text-slate-600">
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
          </>
        )}
      </div>
    </div>
  );
}
