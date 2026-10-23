import { apiFetch } from './api';

export type PercentisMercado = { p25: number; mediana: number; p75: number };

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

export function posicaoPrecoMercado(
  preco: string | number,
  faixa: FaixaMercadoDisponivel,
): 'abaixo da faixa' | 'dentro da faixa' | 'acima da faixa' | null {
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
