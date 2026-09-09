"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import CurrencyInput from "@/src/components/CurrencyInput";

type Produto = {
  id: string;
  nome: string;
  categoria?: { nome: string };
  custo_aquisicao: string;
  preco_venda_atual?: string | null;
  variantes: { tamanho: string; quantidade_estoque: number; estoque_minimo_alerta: number }[];
};
type Categoria = { id: string; nome: string };
type Filtros = {
  nome: string;
  categoriaId: string;
  status: string;
  precoMin: string;
  precoMax: string;
};
type SortColumn = "nome" | "categoria" | "estoque" | "preco" | "lucro" | "status";
type Sort = { column: SortColumn; direction: "asc" | "desc" };

const filtrosIniciais: Filtros = {
  nome: "",
  categoriaId: "",
  status: "",
  precoMin: "",
  precoMax: "",
};

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "em_estoque", label: "Em estoque" },
  { value: "estoque_baixo", label: "Baixo" },
  { value: "critico", label: "Crítico" },
];

const STATUS_ESTILO: Record<string, { bg: string; fg: string }> = {
  "Em estoque": { bg: "#eafaf1", fg: "#047857" },
  "Estoque baixo": { bg: "#fff7ea", fg: "#b45309" },
  "Crítico": { bg: "#fdeeee", fg: "#b91c1c" },
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function contarFiltrosAtivos(filtros: Filtros) {
  return Object.values(filtros).filter((value) => value !== "").length;
}

function sigla(nome: string) {
  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return "—";
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
  return (palavras[0][0] + palavras[1][0]).toUpperCase();
}

function grade(product: Produto) {
  const tamanhos = [...new Set(product.variantes.map((v) => v.tamanho).filter(Boolean))];
  return tamanhos.length > 0 ? tamanhos.join(" · ") : "—";
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Produto[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [filters, setFilters] = useState<Filtros>(filtrosIniciais);
  const [draftFilters, setDraftFilters] = useState<Filtros>(filtrosIniciais);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sort, setSort] = useState<Sort>({ column: "nome", direction: "asc" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(filtersToApply: Filtros = filters) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filtersToApply.nome.trim()) params.set("nome", filtersToApply.nome.trim());
      if (filtersToApply.categoriaId)
        params.set("categoria_id", filtersToApply.categoriaId);
      if (filtersToApply.status) params.set("status", filtersToApply.status);
      if (filtersToApply.precoMin !== "")
        params.set("preco_min", filtersToApply.precoMin);
      if (filtersToApply.precoMax !== "")
        params.set("preco_max", filtersToApply.precoMax);

      const query = params.toString();
      const response = await apiFetch(`/api/produtos${query ? `?${query}` : ""}`);
      if (!response.ok)
        throw new Error("Não foi possível carregar os produtos.");
      const body = await response.json();
      setProducts(body.produtos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar produtos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError("");
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          apiFetch("/api/categorias"),
          apiFetch("/api/produtos"),
        ]);
        if (!categoriesResponse.ok)
          throw new Error("Não foi possível carregar as categorias.");
        if (!productsResponse.ok)
          throw new Error("Não foi possível carregar os produtos.");

        const [categoriesBody, productsBody] = await Promise.all([
          categoriesResponse.json(),
          productsResponse.json(),
        ]);
        setCategories(categoriesBody.categorias);
        setProducts(productsBody.produtos);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar dados.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  // Fecha a gaveta de filtros com a tecla Esc
  useEffect(() => {
    if (!drawerOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  function updateDraftFilter(field: keyof Filtros, value: string) {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  }

  function openDrawer() {
    setDraftFilters(filters);
    setDrawerOpen(true);
  }

  function applyDraftFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draftFilters);
    setDrawerOpen(false);
    void load(draftFilters);
  }

  function clearFilters() {
    setFilters(filtrosIniciais);
    setDraftFilters(filtrosIniciais);
    setDrawerOpen(false);
    void load(filtrosIniciais);
  }

  async function remove(product: Produto) {
    if (
      !window.confirm(
        `Excluir "${product.nome}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    const response = await apiFetch(`/api/produtos/${product.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Não foi possível excluir o produto.");
      return;
    }
    setProducts((current) => current.filter(({ id }) => id !== product.id));
  }

  function stock(product: Produto) {
    return product.variantes.reduce(
      (total, item) => total + item.quantidade_estoque,
      0,
    );
  }

  function status(product: Produto) {
    const quantity = stock(product);
    const min = product.variantes.reduce(
      (total, item) => total + item.estoque_minimo_alerta,
      0,
    );
    return quantity <= 0 ? "Crítico" : quantity <= min ? "Estoque baixo" : "Em estoque";
  }

  function toggleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" },
    );
  }

  const sortedProducts = (() => {
    const valueFor = (product: Produto): string | number => {
      const price = Number(product.preco_venda_atual || 0);

      switch (sort.column) {
        case "categoria":
          return product.categoria?.nome || "";
        case "estoque":
          return stock(product);
        case "preco":
          return price;
        case "lucro":
          return price - Number(product.custo_aquisicao);
        case "status":
          return status(product);
        default:
          return product.nome;
      }
    };

    return [...products].sort((first, second) => {
      const firstValue = valueFor(first);
      const secondValue = valueFor(second);
      const result = typeof firstValue === "string"
        ? firstValue.localeCompare(String(secondValue), "pt-BR", { sensitivity: "base" })
        : firstValue - Number(secondValue);

      return sort.direction === "asc" ? result : -result;
    });
  })();

  const activeFilterCount = contarFiltrosAtivos(filters);
  const totalUnidades = products.reduce((total, p) => total + stock(p), 0);
  const valorVenda = products.reduce(
    (total, p) => total + Number(p.preco_venda_atual || 0) * stock(p),
    0,
  );

  return (
    <div className="max-w-330 px-8.5 pb-13 pt-7.5 mm-screen-in">

      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.09em] text-[#0080ff]">Inventário</p>
          <h1 className="mt-1.5 text-[29px] font-extrabold tracking-tight text-[#0f172a]">Inventário de peças</h1>
          <p className="mt-1.5 text-sm text-[#64748b]">
            {products.length} {products.length === 1 ? "produto" : "produtos"} · {totalUnidades} unidades em estoque · valor de venda {money.format(valorVenda)}
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={openDrawer}
            className="mm-hover flex h-10.5 items-center gap-2 rounded-[11px] border border-[#dfe6f2] bg-white px-4.25 text-sm font-bold text-[#334155] hover:border-[#0080ff] hover:text-[#0080ff]"
          >
            <SlidersHorizontal size={17} strokeWidth={1.6} />
            Filtros
            <span className="flex h-4.75 min-w-4.75 items-center justify-center rounded-full bg-[#0080ff] px-1.25 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          </button>
          <Link
            href="/produtos/novo"
            className="mm-hover flex h-10.5 items-center gap-2 rounded-[11px] bg-[#0080ff] px-4.75 text-sm font-bold text-white shadow-[0_8px_18px_-10px_rgba(0,128,255,0.9)] hover:-translate-y-px hover:bg-[#1a3673] active:translate-y-0 active:scale-[.985]"
          >
            <Plus size={17} strokeWidth={1.8} />
            Novo produto
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} <button onClick={() => void load()} className="cursor-pointer underline">Tentar novamente</button>
        </div>
      )}

      <div className="mm-rise-in overflow-hidden rounded-2xl border border-[#e4eaf4] bg-white">
        <div
          className="grid items-center gap-3 border-b border-[#eef2f8] bg-[#fafbfe] px-5.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-[#8494ad]"
          style={{ gridTemplateColumns: 'minmax(0,2.1fr) 1fr 0.7fr 1fr 1fr 1.05fr 78px' }}
        >
          <SortableHeader label="Produto" column="nome" sort={sort} onSort={toggleSort} />
          <SortableHeader label="Categoria" column="categoria" sort={sort} onSort={toggleSort} />
          <SortableHeader label="Estoque" column="estoque" sort={sort} onSort={toggleSort} />
          <SortableHeader label="Preço venda" column="preco" sort={sort} onSort={toggleSort} />
          <SortableHeader label="Lucro un." column="lucro" sort={sort} onSort={toggleSort} />
          <SortableHeader label="Status" column="status" sort={sort} onSort={toggleSort} />
          <span className="text-right">Ações</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#8494ad]">Carregando…</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#8494ad]">Nenhum produto cadastrado.</div>
        ) : (
          sortedProducts.map((product) => {
            const price = Number(product.preco_venda_atual || 0);
            const profit = price - Number(product.custo_aquisicao);
            const statusLabel = status(product);
            const statusStyle = STATUS_ESTILO[statusLabel];
            return (
              <div
                key={product.id}
                className="mm-hover grid items-center gap-3 border-b border-[#f4f7fb] px-5.5 py-3.75 last:border-b-0 hover:bg-[#f8fbff]"
                style={{ gridTemplateColumns: 'minmax(0,2.1fr) 1fr 0.7fr 1fr 1fr 1.05fr 78px' }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[10px] bg-[#f1f5fc] text-xs font-extrabold text-[#1a3673]">
                    {sigla(product.nome)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0f172a]">{product.nome}</p>
                    <p className="mt-0.5 text-[11.5px] text-[#94a3b8]">{grade(product)}</p>
                  </div>
                </div>
                <div className="truncate text-[13.5px] text-[#475569]">{product.categoria?.nome || "—"}</div>
                <div className="text-[13.5px] font-semibold text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{stock(product)}</div>
                <div className="text-[13.5px] text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {product.preco_venda_atual ? money.format(price) : "—"}
                </div>
                <div className="text-[13.5px] font-bold text-[#047857]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {product.preco_venda_atual ? money.format(profit) : "—"}
                </div>
                <div>
                  <span
                    className="inline-block rounded-full px-2.75 py-1 text-[11.5px] font-bold"
                    style={{ background: statusStyle.bg, color: statusStyle.fg }}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="flex justify-end gap-1.5">
                  <Link
                    aria-label={`Editar ${product.nome}`}
                    href={`/produtos/${product.id}`}
                    className="mm-hover flex h-7.5 w-7.5 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#eef4ff] hover:text-[#0080ff]"
                  >
                    <Pencil size={16} strokeWidth={1.6} />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Excluir ${product.nome}`}
                    onClick={() => remove(product)}
                    className="mm-hover flex h-7.5 w-7.5 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#fef2f2] hover:text-red-600"
                  >
                    <Trash2 size={16} strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {!loading && products.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-5.5 py-3.5 text-[12.5px] text-[#8494ad]">
            <span>Mostrando {sortedProducts.length} {sortedProducts.length === 1 ? "produto" : "produtos"}</span>
            <span className="flex items-center gap-1.75">
              <i className="block h-2 w-2 rounded-[3px] bg-[#10b981]" />Em estoque
              <i className="ml-2 block h-2 w-2 rounded-[3px] bg-[#f59e0b]" />Baixo
              <i className="ml-2 block h-2 w-2 rounded-[3px] bg-[#dc2626]" />Crítico
            </span>
          </div>
        )}
      </div>

      {drawerOpen && createPortal(
        <>
          <div
            role="presentation"
            onClick={() => setDrawerOpen(false)}
            className="mm-fade fixed inset-0 z-[60] bg-[rgba(15,23,42,.34)]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filtros-titulo"
            className="mm-slide-right fixed inset-y-0 right-0 z-[61] flex w-98 flex-col border-l border-[#e4eaf4] bg-white p-6.5 shadow-[-24px_0_60px_-30px_rgba(15,23,42,.45)]"
          >
            <div className="flex items-center justify-between">
              <h2 id="filtros-titulo" className="text-lg font-extrabold text-[#0f172a]">Filtrar produtos</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar filtros"
                className="mm-hover flex h-8 w-8 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#f1f5fb]"
              >
                <X size={17} strokeWidth={1.8} />
              </button>
            </div>

            <form onSubmit={applyDraftFilters} className="mt-6 flex flex-1 flex-col gap-4">
              <label className="block text-[12.5px] font-bold text-[#475569]">
                Nome do produto
                <input
                  value={draftFilters.nome}
                  onChange={(event) => updateDraftFilter("nome", event.target.value)}
                  placeholder="Buscar por nome"
                  className="mm-hover mt-2 h-11 w-full rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.5 text-sm font-medium text-[#0f172a] outline-none focus:border-[#0080ff] focus:shadow-[0_0_0_3px_rgba(0,128,255,.14)]"
                />
              </label>

              <label className="block text-[12.5px] font-bold text-[#475569]">
                Categoria
                <select
                  value={draftFilters.categoriaId}
                  onChange={(event) => updateDraftFilter("categoriaId", event.target.value)}
                  className="mt-2 h-11 w-full cursor-pointer rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3 text-sm font-medium text-[#0f172a] outline-none"
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nome}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="mb-2 text-[12.5px] font-bold text-[#475569]">Status do estoque</p>
                <div className="flex gap-2">
                  {STATUS_PILLS.map((pill) => {
                    const active = draftFilters.status === pill.value;
                    return (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => updateDraftFilter("status", pill.value)}
                        className={`mm-hover flex-1 rounded-[10px] border py-2.25 text-center text-[12.5px] font-bold ${
                          active ? "border-[#0080ff] bg-[#eef4ff] text-[#1a3673]" : "border-[#dfe6f2] bg-white text-[#64748b]"
                        }`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-[12.5px] font-bold text-[#475569]">
                  Preço mínimo
                  <div className="mt-2 flex h-11 items-center gap-1.5 rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.25">
                    <span className="text-[13px] font-bold text-[#94a3b8]">R$</span>
                    <CurrencyInput
                      value={draftFilters.precoMin}
                      onChange={(value) => updateDraftFilter("precoMin", value)}
                      className="w-full bg-transparent text-sm font-semibold text-[#0f172a] outline-none"
                    />
                  </div>
                </label>
                <label className="text-[12.5px] font-bold text-[#475569]">
                  Preço máximo
                  <div className="mt-2 flex h-11 items-center gap-1.5 rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.25">
                    <span className="text-[13px] font-bold text-[#94a3b8]">R$</span>
                    <CurrencyInput
                      value={draftFilters.precoMax}
                      onChange={(value) => updateDraftFilter("precoMax", value)}
                      className="w-full bg-transparent text-sm font-semibold text-[#0f172a] outline-none"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-auto flex gap-2.5 border-t border-[#eef2f8] pt-4.5">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={loading}
                  className="mm-hover flex-1 rounded-[11px] border border-[#dfe6f2] py-3.25 text-sm font-bold text-[#475569] hover:bg-[#f6f8fc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="mm-hover flex-[1.4] rounded-[11px] bg-[#0080ff] py-3.25 text-sm font-bold text-white hover:bg-[#1a3673] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Aplicar filtros
                </button>
              </div>
            </form>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

function SortableHeader({
  label,
  column,
  sort,
  onSort,
}: {
  label: string;
  column: SortColumn;
  sort: Sort;
  onSort: (column: SortColumn) => void;
}) {
  const isActive = sort.column === column;
  const Icon = isActive
    ? sort.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="mm-hover flex cursor-pointer items-center gap-1 text-left hover:text-[#1a3673]"
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      <Icon size={12} aria-hidden="true" />
    </button>
  );
}
