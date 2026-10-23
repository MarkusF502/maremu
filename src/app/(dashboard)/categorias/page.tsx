"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import {
  CategoriaLoja,
  CategoriaPai,
  caminhoDaClassificacao,
  fetchTaxonomia,
  mensagemDeErro,
} from "@/src/lib/taxonomia";
import NovaCategoriaModal from "@/src/components/NovaCategoriaModal";
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
  const [nomesEmEdicao, setNomesEmEdicao] = useState<Record<string, string>>({});
  const [modalAberto, setModalAberto] = useState(false);

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

  // PATCH comum à classificação e à renomeação: a linha é substituída pela
  // categoria devolvida pela API.
  async function salvarCategoria(
    categoria: CategoriaLoja,
    payload: { nome?: string; sub_categoria_id?: number },
    fallback: string,
  ): Promise<boolean> {
    setSalvando(categoria.id);
    setErros((current) => semAChave(current, categoria.id));
    try {
      const response = await apiFetch(`/api/categorias/${categoria.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErros((current) => ({
          ...current,
          [categoria.id]: mensagemDeErro(body, fallback),
        }));
        return false;
      }
      const { categoria: atualizada }: { categoria: CategoriaLoja } =
        await response.json();
      setCategorias((current) =>
        current.map((item) => (item.id === categoria.id ? atualizada : item)),
      );
      return true;
    } catch {
      setErros((current) => ({ ...current, [categoria.id]: fallback }));
      return false;
    } finally {
      setSalvando(null);
    }
  }

  async function classificar(categoria: CategoriaLoja) {
    const escolha = escolhas[categoria.id];
    if (!escolha?.subId) return;

    const ok = await salvarCategoria(
      categoria,
      { sub_categoria_id: escolha.subId },
      "Não foi possível classificar a categoria.",
    );
    if (ok) fecharReclassificacao(categoria.id);
  }

  function abrirEdicaoDoNome(categoria: CategoriaLoja) {
    setErros((current) => semAChave(current, categoria.id));
    setNomesEmEdicao((current) => ({ ...current, [categoria.id]: categoria.nome }));
  }

  function fecharEdicaoDoNome(categoriaId: string) {
    setNomesEmEdicao((current) => semAChave(current, categoriaId));
    setErros((current) => semAChave(current, categoriaId));
  }

  async function renomear(categoria: CategoriaLoja) {
    const nome = (nomesEmEdicao[categoria.id] ?? "").trim();
    if (!nome) return;

    // Sem mudança, não há o que pedir à API.
    if (nome === categoria.nome) {
      fecharEdicaoDoNome(categoria.id);
      return;
    }

    const ok = await salvarCategoria(
      categoria,
      { nome },
      "Não foi possível renomear a categoria.",
    );
    if (ok) fecharEdicaoDoNome(categoria.id);
  }

  function adicionarCategoria(categoria: CategoriaLoja) {
    setCategorias((current) =>
      [...current, categoria].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    );
    setModalAberto(false);
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
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          disabled={loading}
          className="mm-hover flex h-10.5 items-center gap-2 rounded-[11px] bg-[#0080ff] px-4.75 text-sm font-bold text-white shadow-[0_8px_18px_-10px_rgba(0,128,255,0.9)] hover:-translate-y-px hover:bg-[#1a3673] active:translate-y-0 active:scale-[.985] disabled:opacity-60"
        >
          <Plus size={17} strokeWidth={1.8} />
          Nova categoria
        </button>
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
            const nomeEmEdicao = nomesEmEdicao[categoria.id];

            return (
              <div
                key={categoria.id}
                className="border-b border-[#f4f7fb] px-5.5 py-4.25 last:border-b-0"
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-50 flex-1">
                    {nomeEmEdicao === undefined ? (
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-[#0f172a]">
                          {categoria.nome}
                        </p>
                        <button
                          type="button"
                          aria-label={`Editar o nome de ${categoria.nome}`}
                          onClick={() => abrirEdicaoDoNome(categoria)}
                          className="mm-hover flex h-7 w-7 items-center justify-center rounded-[8px] text-[#a5b2c6] hover:bg-[#eef4ff] hover:text-[#0080ff]"
                        >
                          <Pencil size={14} strokeWidth={1.8} />
                        </button>
                      </div>
                    ) : (
                      <div className="mm-rise-in flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={nomeEmEdicao}
                          disabled={salvando === categoria.id}
                          aria-label={`Nome de ${categoria.nome}`}
                          onChange={(event) =>
                            setNomesEmEdicao((current) => ({
                              ...current,
                              [categoria.id]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void renomear(categoria);
                            }
                            if (event.key === "Escape") {
                              event.preventDefault();
                              fecharEdicaoDoNome(categoria.id);
                            }
                          }}
                          className="h-9 w-full max-w-60 rounded-[10px] border border-[#e0e7f3] bg-[#fbfcfe] px-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff] focus:shadow-[0_0_0_3px_rgba(0,128,255,.14)]"
                        />
                        <button
                          type="button"
                          aria-label="Salvar nome"
                          onClick={() => void renomear(categoria)}
                          disabled={!nomeEmEdicao.trim() || salvando === categoria.id}
                          className="mm-hover flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0080ff] text-white hover:bg-[#1a3673] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Check size={15} strokeWidth={2.4} />
                        </button>
                        <button
                          type="button"
                          aria-label="Cancelar edição do nome"
                          onClick={() => fecharEdicaoDoNome(categoria.id)}
                          className="mm-hover flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#dfe6f2] text-[#64748b] hover:bg-[#f1f5fb]"
                        >
                          <X size={15} strokeWidth={2} />
                        </button>
                      </div>
                    )}
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

      {modalAberto && (
        <NovaCategoriaModal
          arvore={taxonomia}
          onCriada={adicionarCategoria}
          close={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
