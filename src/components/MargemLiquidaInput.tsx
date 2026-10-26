"use client";

import { useEffect, useId, useState } from "react";
import CurrencyInput from "./CurrencyInput";
import { DadosSimulacaoMargem, SimulacaoMargem, dadosSimulacaoCompletos, margemLiquidaValida, simularMargemLiquida } from "@/src/lib/margem-liquida";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numero = (valor: number, casas = 2) => valor.toLocaleString("pt-BR", { maximumFractionDigits: casas });

export default function MargemLiquidaInput({
  value, onChange, dadosSimulacao, sugestao = false, disabled = false, onInviavelChange,
}: {
  /** Fração decimal, como na API (0,20 = 20%). */
  value: number;
  onChange: (value: number) => void;
  dadosSimulacao?: DadosSimulacaoMargem;
  sugestao?: boolean;
  disabled?: boolean;
  onInviavelChange?: (inviavel: boolean) => void;
}) {
  const id = useId();
  const [editado, setEditado] = useState(false);
  const [custo, setCusto] = useState("50");
  const [resultado, setResultado] = useState<{ chave: string; simulacao: SimulacaoMargem | null } | null>(null);
  const { custo_fixo_mensal, volume_vendas_esperado, aliquota_efetiva, taxa_canal } = dadosSimulacao ?? {};
  // Sem contexto explícito, configurações usa os dados da loja na API.
  const contextoCompleto = dadosSimulacao === undefined || dadosSimulacaoCompletos(dadosSimulacao);
  const chave = JSON.stringify([contextoCompleto, value, custo, custo_fixo_mensal, volume_vendas_esperado, aliquota_efetiva, taxa_canal]);
  const simulacao = contextoCompleto && resultado?.chave === chave ? resultado.simulacao : null;
  const inviavel = simulacao?.viavel === false;
  const foraDaFaixa = !margemLiquidaValida(value);

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      onInviavelChange?.(false);
      if (!contextoCompleto || !margemLiquidaValida(value) || !Number.isFinite(Number(custo)) || Number(custo) <= 0) return;
      try {
        const resposta = await simularMargemLiquida(value, Number(custo), {
          custo_fixo_mensal, volume_vendas_esperado, aliquota_efetiva, taxa_canal,
        }, controller.signal);
        if (!ativo) return;
        setResultado({ chave, simulacao: resposta });
        onInviavelChange?.(resposta?.viavel === false);
      } catch {
        if (!ativo) return;
        setResultado({ chave, simulacao: null });
        onInviavelChange?.(false);
      }
    }, 300);
    return () => { ativo = false; clearTimeout(timer); controller.abort(); };
  }, [contextoCompleto, value, custo, custo_fixo_mensal, volume_vendas_esperado, aliquota_efetiva, taxa_canal, chave, onInviavelChange]);

  const inputClass = "w-full min-w-0 rounded-lg border bg-white px-3 py-2.5 text-sm text-[#1E293B] outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-50";

  return (
    <div className="w-full min-w-0 max-w-full space-y-2">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Lucro limpo desejado</label>
      <p id={`${id}-explicacao`} className="max-w-full whitespace-normal wrap-break-word text-xs leading-relaxed text-slate-500">
        É o que sobra para você de cada venda, depois de pagar a peça, as contas da loja e os impostos.
      </p>
      {sugestao && !editado && <p className="text-xs text-[#2563EB]">Sugestão para o seu posicionamento</p>}
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="relative">
          <input id={id} type="number" inputMode="decimal" min={1} max={60} step="any" required
            value={value === 0 ? "" : Number((value * 100).toFixed(6))}
            onChange={(e) => { setEditado(true); onInviavelChange?.(false); onChange(Number(e.target.value) / 100); }}
            disabled={disabled} aria-invalid={foraDaFaixa || inviavel}
            aria-describedby={`${id}-explicacao ${id}-faixa ${id}-traducao`}
            className={`${inputClass} pr-8 ${foraDaFaixa || inviavel ? "border-red-400" : "border-slate-200 focus:border-[#2563EB]"}`} />
          <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-slate-400">%</span>
        </div>
        <div>
          <label htmlFor={`${id}-custo`} className="mb-1 block text-xs text-slate-500">Custo de exemplo (R$)</label>
          <CurrencyInput id={`${id}-custo`} value={custo} onChange={setCusto} disabled={disabled}
            className={`${inputClass} border-slate-200 focus:border-[#2563EB]`} />
        </div>
      </div>
      <p id={`${id}-faixa`} className="text-xs text-red-600">{foraDaFaixa ? "Informe um percentual de 1% a 60%." : ""}</p>
      <div id={`${id}-traducao`} aria-live="polite" aria-atomic="true" className={`min-w-0 max-w-full whitespace-normal wrap-anywhere text-xs leading-relaxed ${simulacao ? "rounded-lg border border-slate-200 bg-slate-50 p-3" : ""} ${inviavel ? "text-red-600" : "text-slate-600"}`}>
        {simulacao?.viavel === true && <div className="space-y-1">
          <p>A cada R$ 100 vendidos, sobram {moeda(simulacao.lucro_a_cada_100)} para você.</p>
          <p>Uma peça que custa {moeda(Number(custo))} sairia por {moeda(simulacao.preco)}, cerca de {numero(simulacao.multiplo_do_custo)} vez o custo.</p>
        </div>}
        {simulacao?.viavel === false && <p>Com os custos da sua loja, o lucro limpo máximo possível é de {numero(simulacao.margem_maxima * 100, 4)}%.</p>}
      </div>
    </div>
  );
}
