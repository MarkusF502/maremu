import { apiFetch } from "./api";

export type DadosSimulacaoMargem = {
  custo_fixo_mensal?: number;
  volume_vendas_esperado?: number;
  aliquota_efetiva?: number;
  taxa_canal?: number;
};

export type SimulacaoMargem =
  | { viavel: true; preco: number; preco_piso: number; multiplo_do_custo: number;
      lucro_por_peca: number; lucro_a_cada_100: number }
  | { viavel: false; motivo: "margem_inviavel"; margem_maxima: number };

export function margemLiquidaValida(margem: number) {
  return Number.isFinite(margem) && margem >= 0.01 && margem <= 0.60;
}

export async function simularMargemLiquida(
  margem: number, custoBase: number, dados: DadosSimulacaoMargem, signal: AbortSignal,
): Promise<SimulacaoMargem | null> {
  const res = await apiFetch("/api/precificacao/simular", {
    method: "POST", signal,
    body: JSON.stringify({ ...dados, margem, custo_base: custoBase }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Uma resposta incompleta não deve produzir uma tradução enganosa.
  if (data.viavel === true && [data.preco, data.multiplo_do_custo, data.lucro_a_cada_100].every(Number.isFinite)) return data;
  if (data.viavel === false && data.motivo === "margem_inviavel" && Number.isFinite(data.margem_maxima)) return data;
  return null;
}
