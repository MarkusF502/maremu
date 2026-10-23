import { apiFetch } from './api';

export type PercentisMercado = { p25: number; mediana: number; p75: number };

export type FaixaMercadoDisponivel = {
  disponivel: true;
  sub_categoria: { id: number; nome: string };
  n_lojas: number;
  filtros_aplicados: ('posicionamento' | 'faixa_faturamento')[];
  preco: PercentisMercado;
  margem: PercentisMercado;
  giro: PercentisMercado | null;
};

export type FaixaMercadoResposta = FaixaMercadoDisponivel | {
  disponivel: false;
  motivo:
    | 'categoria_sem_classificacao'
    | 'sub_categoria_nao_comparavel'
    | 'amostra_insuficiente';
};

export async function fetchFaixaMercado(
  categoriaId: string,
  signal?: AbortSignal,
): Promise<FaixaMercadoResposta> {
  const query = new URLSearchParams({ categoria_id: categoriaId });
  const response = await apiFetch(`/api/mercado/faixa?${query}`, { signal });
  if (!response.ok) throw new Error('Não foi possível carregar a faixa de mercado.');
  return response.json();
}
