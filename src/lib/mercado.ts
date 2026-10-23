import { apiFetch } from './api';

export type PercentisMercado = { p25: number; mediana: number; p75: number };

export type ComposicaoPreco = {
  preco_piso: number;
  custo_base: number;
  custo_fixo_unitario: number;
  percentual_variavel: number;
};

export type DiagnosticoPreco =
  | 'piso_acima_da_faixa'
  | 'ideal_acima_da_faixa'
  | 'tudo_abaixo_da_faixa'
  | 'sem_diagnostico';

// A ordem é intencional: o piso tem prioridade sobre o ideal e os demais preços.
// Comparações estritas mantêm os valores iguais a p25/p75 dentro da faixa.
export function diagnosticarPrecoMercado(
  faixa: Pick<PercentisMercado, 'p25' | 'p75'>,
  piso: number,
  cenarios: readonly { tipo: string; preco_sugerido: number }[],
): DiagnosticoPreco {
  if (piso > faixa.p75) return 'piso_acima_da_faixa';
  const ideal = cenarios.find(({ tipo }) => tipo === 'ideal');
  if (ideal && ideal.preco_sugerido > faixa.p75) return 'ideal_acima_da_faixa';
  if (cenarios.length > 0 && cenarios.every(({ preco_sugerido }) => preco_sugerido < faixa.p25)) {
    return 'tudo_abaixo_da_faixa';
  }
  return 'sem_diagnostico';
}

export type FaixaMercadoDisponivel = {
  disponivel: true;
  sub_categoria: { id: number; nome: string };
  n_lojas: number;
  filtros_aplicados: ('posicionamento' | 'faixa_faturamento')[];
  preco: PercentisMercado;
  margem: PercentisMercado | null;
  giro: PercentisMercado | null;
};

export type FaixaMercadoResposta = FaixaMercadoDisponivel | {
  disponivel: false;
  motivo:
    | 'categoria_sem_classificacao'
    | 'sub_categoria_nao_comparavel'
    | 'amostra_insuficiente';
};

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function descricaoFaixaMercado(faixa: FaixaMercadoDisponivel): string {
  const porte = faixa.filtros_aplicados.includes('faixa_faturamento')
    ? ' de porte parecido com a sua'
    : '';
  return `Lojas semelhantes vendem entre ${money(faixa.preco.p25)} e ${money(faixa.preco.p75)} (mediana ${money(faixa.preco.mediana)}), com base em ${faixa.n_lojas} lojas${porte}.`;
}

export type PosicaoPrecoMercado = 'abaixo da faixa' | 'dentro da faixa' | 'acima da faixa';

export function posicaoPrecoMercado(
  preco: string | number,
  faixa: FaixaMercadoDisponivel,
): PosicaoPrecoMercado | null {
  if (typeof preco === 'string' && preco.trim() === '') return null;
  const valor = Number(preco);
  if (!Number.isFinite(valor)) return null;
  if (valor < faixa.preco.p25) return 'abaixo da faixa';
  if (valor > faixa.preco.p75) return 'acima da faixa';
  return 'dentro da faixa';
}

export async function fetchFaixaMercado(
  categoriaId: string,
  signal?: AbortSignal,
): Promise<FaixaMercadoResposta> {
  const query = new URLSearchParams({ categoria_id: categoriaId });
  const response = await apiFetch(`/api/mercado/faixa?${query}`, { signal });
  if (!response.ok) throw new Error('Não foi possível carregar a faixa de mercado.');
  return response.json();
}
