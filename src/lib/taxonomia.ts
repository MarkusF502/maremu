import { apiFetch } from './api';

// Árvore fixa de 2 níveis servida por GET /api/taxonomia.
export type SubCategoria = { id: number; nome: string };
export type CategoriaPai = { id: number; nome: string; sub_categorias: SubCategoria[] };

// Classificação que acompanha cada categoria da loja em /api/categorias.
export type Classificacao = {
  id: number;
  categoria_pai_id: number;
  nome: string;
  categoria_pai: { id: number; nome: string };
};

// Categoria da loja: nome livre + o ponto da taxonomia onde ela se encaixa.
export type CategoriaLoja = {
  id: string;
  nome: string;
  sub_categoria_id: number | null;
  sub_categoria?: Classificacao | null;
};

// Nome usado nas categorias-pai que não têm sub-categorias próprias.
const SUB_GERAL = 'Geral';

export async function fetchTaxonomia(): Promise<CategoriaPai[]> {
  const response = await apiFetch('/api/taxonomia');
  if (!response.ok) throw new Error('Não foi possível carregar a taxonomia.');
  const { categorias_pai }: { categorias_pai: CategoriaPai[] } = await response.json();
  return categorias_pai;
}

// Pais com uma sub-categoria só ("Geral") não precisam do segundo select.
export function subUnica(pai: CategoriaPai | undefined): SubCategoria | null {
  return pai && pai.sub_categorias.length === 1 ? pai.sub_categorias[0] : null;
}

// "Geral" não diz nada ao lojista: nesse caso o nome que vale é o do pai.
export function nomeDaClassificacao(pai: CategoriaPai, sub: SubCategoria): string {
  return sub.nome === SUB_GERAL ? pai.nome : sub.nome;
}

export function caminhoDaClassificacao(categoria: CategoriaLoja): string | null {
  const sub = categoria.sub_categoria;
  return sub ? `${sub.categoria_pai.nome} › ${sub.nome}` : null;
}

export function rotuloDaCategoria(categoria: CategoriaLoja): string {
  const caminho = caminhoDaClassificacao(categoria);
  return caminho ? `${categoria.nome} (${caminho})` : `${categoria.nome} (sem classificação)`;
}

// A resposta do POST/PATCH não traz a relação carregada; monta a classificação
// a partir da árvore para a lista refletir o novo estado sem recarregar tudo.
export function classificacaoLocal(pai: CategoriaPai, sub: SubCategoria): Classificacao {
  return {
    id: sub.id,
    categoria_pai_id: pai.id,
    nome: sub.nome,
    categoria_pai: { id: pai.id, nome: pai.nome },
  };
}

// Mensagens de validação do Laravel (422) achatadas para exibição.
export function mensagemDeErro(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const { errors, message } = body as { errors?: Record<string, string[]>; message?: string };
    if (errors) {
      const mensagens = Object.values(errors).flat();
      if (mensagens.length > 0) return mensagens.join(' ');
    }
    if (message) return message;
  }
  return fallback;
}
