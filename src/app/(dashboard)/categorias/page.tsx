"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import {
  CategoriaLoja,
  CategoriaPai,
  caminhoDaClassificacao,
  fetchTaxonomia,
  mensagemDeErro,
} from "@/src/lib/taxonomia";
import TaxonomiaSelects from "@/src/components/TaxonomiaSelects";

type Escolha = { paiId: number | ""; subId: number | "" };

function semAChave<T>(mapa: Record<string, T>, chave: string): Record<string, T> {
  return Object.fromEntries(
    Object.entries(mapa).filter(([atual]) => atual !== chave),
  );
}

// Pré-seleciona os selects com a classificação atual, quando existe.
function escolhaInicial(categoria: CategoriaLoja): Escolha {
  const sub = categoria.sub_categoria;
  return sub
    ? { paiId: sub.categoria_pai_id, subId: sub.id }
    : { paiId: "", subId: "" };
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaLoja[]>([]);
  const [taxonomia, setTaxonomia] = useState<CategoriaPai[]>([]);
  const [escolhas, setEscolhas] = useState<Record<string, Escolha>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [categoriasResponse, taxonomiaData] = await Promise.all([
          apiFetch("/api/categorias"),
          fetchTaxonomia(),
        ]);
        if (!categoriasResponse.ok)
          throw new Error("Não foi possível carregar as categorias.");
        const { categorias: lista }: { categorias: CategoriaLoja[] } =
          await categoriasResponse.json();

        setCategorias(lista);
        setTaxonomia(taxonomiaData);
        // As pendentes já abrem com os selects à mostra; as classificadas só
        // quando o lojista pedir para reclassificar.
        setEscolhas(
          Object.fromEntries(
            lista
              .filter((categoria) => !categoria.sub_categoria_id)
              .map((categoria) => [categoria.id, escolhaInicial(categoria)]),
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [tentativa]);

  function abrirReclassificacao(categoria: CategoriaLoja) {
    setEscolhas((current) => ({
      ...current,
      [categoria.id]: escolhaInicial(categoria),
    }));
  }

  function fecharReclassificacao(categoriaId: string) {
    setEscolhas((current) => semAChave(current, categoriaId));
    setErros((current) => semAChave(current, categoriaId));
  }

  async function classificar(categoria: CategoriaLoja) {
    const escolha = escolhas[categoria.id];
    if (!escolha?.subId) return;

    setSalvando(categoria.id);
    setErros((current) => semAChave(current, categoria.id));
    try {
      const response = await apiFetch(`/api/categorias/${categoria.id}`, {
        method: "PATCH",
        body: JSON.stringify({ sub_categoria_id: escolha.subId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErros((current) => ({
          ...current,
          [categoria.id]: mensagemDeErro(
            body,
            "Não foi possível classificar a categoria.",
          ),
        }));
        return;
      }
      const { categoria: classificada }: { categoria: CategoriaLoja } =
        await response.json();
      setCategorias((current) =>
        current.map((item) => (item.id === categoria.id ? classificada : item)),
      );
      fecharReclassificacao(categoria.id);
    } catch {
      setErros((current) => ({
        ...current,
        [categoria.id]: "Não foi possível classificar a categoria.",
      }));
    } finally {
      setSalvando(null);
    }
  }

  const pendentes = categorias.filter(
    (categoria) => !categoria.sub_categoria_id,
  ).length;

  return (
    <div className="max-w-290 px-8.5 pb-13 pt-7.5 mm-screen-in">
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.09em] text-[#0080ff]">
            Taxonomia
          </p>
          <h1 className="mt-1.5 text-[29px] font-extrabold tracking-tight text-[#0f172a]">
            Categorias da loja
          </h1>
          <p className="mt-1.5 text-sm text-[#64748b]">
            A classificação é o que permite comparar seus preços com lojas
            semelhantes.
            {!loading && categorias.length > 0 && (
              <>
                {" "}
                {categorias.length - pendentes} de {categorias.length}{" "}
                {categorias.length === 1
                  ? "categoria classificada"
                  : "categorias classificadas"}
                .
              </>
            )}
          </p>
        </div>
        <Link
          href="/produtos/novo"
          className="mm-hover flex h-10.5 items-center gap-2 rounded-[11px] border border-[#dfe6f2] bg-white px-4.25 text-sm font-bold text-[#334155] hover:border-[#0080ff] hover:text-[#0080ff]"
        >
          <Plus size={17} strokeWidth={1.8} />
          Nova categoria
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}{" "}
          <button
            onClick={() => setTentativa((atual) => atual + 1)}
            className="cursor-pointer underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {pendentes > 0 && (
        <p className="mm-rise-in mb-4 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4.5 py-3.25 text-[13px] font-semibold text-[#92400e]">
          {pendentes}{" "}
          {pendentes === 1
            ? "categoria ainda não foi classificada"
            : "categorias ainda não foram classificadas"}
          . Enquanto isso, elas ficam fora da comparação com outras lojas.
        </p>
      )}

      <div className="mm-rise-in overflow-hidden rounded-2xl border border-[#e4eaf4] bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-[#8494ad]">Carregando…</div>
        ) : categorias.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#8494ad]">
            Nenhuma categoria cadastrada ainda.
          </div>
        ) : (
          categorias.map((categoria) => {
            const escolha = escolhas[categoria.id];
            const caminho = caminhoDaClassificacao(categoria);
            const erro = erros[categoria.id];

            return (
              <div
                key={categoria.id}
                className="border-b border-[#f4f7fb] px-5.5 py-4.25 last:border-b-0"
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-50 flex-1">
                    <p className="text-sm font-semibold text-[#0f172a]">
                      {categoria.nome}
                    </p>
                    {caminho ? (
                      <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#047857]">
                        <Check size={13} strokeWidth={2.4} />
                        {caminho}
                      </p>
                    ) : (
                      <p className="mt-1 text-[12.5px] text-[#b45309]">
                        Sem classificação
                      </p>
                    )}
                  </div>

                  {escolha ? (
                    <div className="flex flex-wrap items-end gap-3">
                      <TaxonomiaSelects
                        arvore={taxonomia}
                        paiId={escolha.paiId}
                        subCategoriaId={escolha.subId}
                        disabled={salvando === categoria.id}
                        className="flex flex-wrap items-end gap-3"
                        onChange={(paiId, subId) =>
                          setEscolhas((current) => ({
                            ...current,
                            [categoria.id]: { paiId, subId },
                          }))
                        }
                      />
                      <div className="flex items-end gap-2">
                        {caminho && (
                          <button
                            type="button"
                            onClick={() => fecharReclassificacao(categoria.id)}
                            className="mm-hover h-11 rounded-[11px] border border-[#dfe6f2] px-4 text-[13px] font-bold text-[#475569] hover:bg-[#f6f8fc]"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void classificar(categoria)}
                          disabled={!escolha.subId || salvando === categoria.id}
                          className="mm-hover h-11 rounded-[11px] bg-[#0080ff] px-5 text-[13px] font-bold text-white hover:bg-[#1a3673] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {salvando === categoria.id ? "Salvando…" : "Salvar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirReclassificacao(categoria)}
                      className="mm-hover h-9.5 rounded-[10px] border border-[#dfe6f2] px-3.75 text-[12.5px] font-bold text-[#475569] hover:border-[#0080ff] hover:text-[#0080ff]"
                    >
                      Reclassificar
                    </button>
                  )}
                </div>

                {erro && (
                  <p className="mm-rise-in mt-3 rounded-[11px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-700">
                    {erro}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
