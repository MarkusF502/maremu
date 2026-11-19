// Recomendação de cenário (API: RecomendacaoCenarioService). Regra
// determinística, sem IA: o sistema recomenda, o lojista escolhe.

export type TipoCenario = 'liquidacao' | 'ideal' | 'alta_demanda';

export type OrigemRecomendacao = 'historico_proprio' | 'lojas_similares';

export type RecomendacaoCenario =
  | {
      disponivel: true;
      cenario_recomendado: TipoCenario;
      origem_recomendacao: OrigemRecomendacao;
      motivo: string;
      sinais: {
        dias_sem_venda: number;
        unidades_vendidas_90d: number;
        giro_produto_dias: number | null;
        giro_referencia_dias: number | null;
        razao_giro_produto: number | null;
      };
      versao_regras: string;
    }
  | {
      disponivel: false;
      motivo_indisponivel: 'sem_estoque' | 'sem_referencia' | 'dados_insuficientes';
    };

export type RecomendacaoDisponivel = Extract<RecomendacaoCenario, { disponivel: true }>;

/** Resumo da listagem de produtos; null quando não há recomendação. */
export type RecomendacaoResumo = {
  cenario_recomendado: TipoCenario;
  difere_do_atual: boolean;
} | null;

/** Rótulo em minúsculas, para o meio da frase ("Sugestão: liquidação"). */
export const CENARIO_EM_FRASE: Record<TipoCenario, string> = {
  liquidacao: 'liquidação',
  ideal: 'venda ideal',
  alta_demanda: 'alta demanda',
};

export const ORIGEM_EM_FRASE: Record<OrigemRecomendacao, string> = {
  historico_proprio: 'com base no histórico da sua loja',
  lojas_similares: 'com base em lojas parecidas com a sua',
};

/** Aceita só o formato esperado; qualquer outra coisa vira "sem recomendação". */
export function recomendacaoValida(valor: unknown): RecomendacaoDisponivel | null {
  if (!valor || typeof valor !== 'object') return null;
  const r = valor as Partial<RecomendacaoDisponivel>;
  if (r.disponivel !== true) return null;
  if (!r.cenario_recomendado || !(r.cenario_recomendado in CENARIO_EM_FRASE)) return null;
  if (!r.origem_recomendacao || !(r.origem_recomendacao in ORIGEM_EM_FRASE)) return null;
  if (typeof r.motivo !== 'string') return null;
  return valor as RecomendacaoDisponivel;
}
