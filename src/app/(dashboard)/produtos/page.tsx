"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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
  genero?: "masculino" | "feminino" | "unisex" | null;
  custo_aquisicao: string;
  preco_venda_atual?: string | null;
  variantes: { quantidade_estoque: number; estoque_minimo_alerta: number }[];
};
type Categoria = { id: string; nome: string };
type Filtros = {
  nome: string;
  categoriaId: string;
  status: string;
  genero: string;
  precoMin: string;
  precoMax: string;
};
type SortColumn = "nome" | "categoria" | "estoque" | "preco" | "lucro" | "status";
type Sort = { column: SortColumn; direction: "asc" | "desc" };

const filtrosIniciais: Filtros = {
  nome: "",
  categoriaId: "",
  status: "",
  genero: "",
  precoMin: "",
  precoMax: "",
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function contarFiltrosAtivos(filtros: Filtros) {
  return Object.values(filtros).filter((value) => value !== "").length;
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Produto[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [filters, setFilters] = useState<Filtros>(filtrosIniciais);
  const [draftFilters, setDraftFilters] = useState<Filtros>(filtrosIniciais);
  const [isFilterModalOpen, setFilterModalOpen] = useState(false);
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
      if (filtersToApply.genero) params.set("genero", filtersToApply.genero);
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

  // Fecha o modal com a tecla Esc
  useEffect(() => {
    if (!isFilterModalOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFilterModalOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFilterModalOpen]);

  function updateDraftFilter(field: keyof Filtros, value: string) {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  }

  function openFilterModal() {
    setDraftFilters(filters);
    setFilterModalOpen(true);
  }

  function applyDraftFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draftFilters);
    setFilterModalOpen(false);
    void load(draftFilters);
  }

  function clearFilters() {
    setFilters(filtrosIniciais);
    setDraftFilters(filtrosIniciais);
    setFilterModalOpen(false);
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
    return quantity <= 0
      ? ["Crítico", "bg-red-500/20 text-red-300"]
      : quantity <= min
        ? ["Estoque Baixo", "bg-orange-500/20 text-orange-300"]
        : ["Em Estoque", "bg-green-500/20 text-green-300"];
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
          return status(product)[0];
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

  return (
    <div className="min-h-screen p-8 bg-[#bfdbfe]">
      <div className="bg-[#1E3A8A] rounded-[32px] p-8 max-w-[1200px] mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Inventário de Peças</h1>
            <p className="mt-1 text-white/70">Gerencie o seu catálogo e estoque.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={openFilterModal}
              className="relative flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-[#172554] px-5 py-3 font-bold text-white hover:bg-[#1e2f6b]"
            >
              <SlidersHorizontal size={20} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0080ff] px-1.5 text-xs font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <Link href="/produtos/novo" className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#0080ff] px-6 py-3 font-bold text-white hover:bg-blue-500">
              <Plus size={20} />
              Novo Produto
            </Link>
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/20 p-4 text-red-100">
            {error} <button onClick={() => void load()} className="cursor-pointer underline">Tentar novamente</button>
          </div>
        )}
        <div className="bg-[#0F172A] rounded-3xl p-6 overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 text-sm text-white/70">
                <SortableHeader label="Produto" column="nome" sort={sort} onSort={toggleSort} />
                <SortableHeader label="Categoria" column="categoria" sort={sort} onSort={toggleSort} />
                <SortableHeader label="Estoque" column="estoque" sort={sort} onSort={toggleSort} />
                <SortableHeader label="Preço Venda" column="preco" sort={sort} onSort={toggleSort} />
                <SortableHeader label="Lucro" column="lucro" sort={sort} onSort={toggleSort} />
                <SortableHeader label="Status" column="status" sort={sort} onSort={toggleSort} />
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="p-8 text-center text-white/70">Carregando…</td></tr> : products.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-white/70">Nenhum produto cadastrado.</td></tr> : sortedProducts.map((product) => {
                const [label, color] = status(product);
                const price = Number(product.preco_venda_atual || 0);
                const profit = price - Number(product.custo_aquisicao);
                return <tr key={product.id} className="border-b border-white/5 text-white/90">
                  <td className="p-4">{product.nome}</td><td className="p-4">{product.categoria?.nome || "—"}</td><td className="p-4">{stock(product)}</td>
                  <td className="p-4">{product.preco_venda_atual ? money.format(price) : "—"}</td><td className="p-4 text-emerald-400">{product.preco_venda_atual ? money.format(profit) : "—"}</td>
                  <td className="p-4"><span className={`rounded-full px-3 py-1 text-sm ${color}`}>{label}</span></td>
                  <td className="p-4"><div className="flex gap-2"><Link aria-label={`Editar ${product.nome}`} href={`/produtos/${product.id}`} className="cursor-pointer text-blue-300 hover:text-white"><Pencil size={18} /></Link><button aria-label={`Excluir ${product.nome}`} onClick={() => remove(product)} className="cursor-pointer text-red-300 hover:text-white"><Trash2 size={18} /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isFilterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="filtros-titulo"
          onClick={() => setFilterModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-[#172554] p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 id="filtros-titulo" className="text-xl font-bold">
                Filtrar produtos
              </h2>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                aria-label="Fechar filtros"
                className="cursor-pointer rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={applyDraftFilters} className="grid gap-4 md:grid-cols-2">
              <label className="text-sm md:col-span-2">
                Nome do produto
                <input
                  value={draftFilters.nome}
                  onChange={(event) => updateDraftFilter("nome", event.target.value)}
                  placeholder="Buscar por nome"
                  className="mt-2 w-full rounded-xl bg-[#0F172A] p-3 placeholder:text-white/40"
                />
              </label>
              <label className="text-sm">
                Categoria
                <select
                  value={draftFilters.categoriaId}
                  onChange={(event) => updateDraftFilter("categoriaId", event.target.value)}
                  className="mt-2 w-full cursor-pointer rounded-xl bg-[#0F172A] p-3"
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Gênero
                <select
                  value={draftFilters.genero}
                  onChange={(event) => updateDraftFilter("genero", event.target.value)}
                  className="mt-2 w-full cursor-pointer rounded-xl bg-[#0F172A] p-3"
                >
                  <option value="">Todos</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="unisex">Unissex</option>
                </select>
              </label>
              <label className="text-sm">
                Status
                <select
                  value={draftFilters.status}
                  onChange={(event) => updateDraftFilter("status", event.target.value)}
                  className="mt-2 w-full cursor-pointer rounded-xl bg-[#0F172A] p-3"
                >
                  <option value="">Todos</option>
                  <option value="em_estoque">Em estoque</option>
                  <option value="estoque_baixo">Estoque baixo</option>
                  <option value="critico">Crítico</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Preço mínimo
                  <div className="mt-2 flex items-center gap-1 rounded-xl bg-[#0F172A] p-3">
                    <span className="text-white/50">R$</span>
                    <CurrencyInput
                      value={draftFilters.precoMin}
                      onChange={(value) => updateDraftFilter("precoMin", value)}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                </label>
                <label className="text-sm">
                  Preço máximo
                  <div className="mt-2 flex items-center gap-1 rounded-xl bg-[#0F172A] p-3">
                    <span className="text-white/50">R$</span>
                    <CurrencyInput
                      value={draftFilters.precoMax}
                      onChange={(value) => updateDraftFilter("precoMax", value)}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={loading}
                  className="cursor-pointer rounded-xl border border-white/30 px-5 py-3 font-bold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Limpar filtros
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer rounded-xl bg-[#0080ff] px-5 py-3 font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Aplicar filtros
                </button>
              </div>
            </form>
          </div>
        </div>
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
    <th className="p-4">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="flex cursor-pointer items-center gap-1 hover:text-white"
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <Icon size={15} aria-hidden="true" />
      </button>
    </th>
  );
}