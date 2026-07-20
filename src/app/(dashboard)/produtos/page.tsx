"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/src/lib/api";

type Produto = {
  id: string;
  nome: string;
  categoria?: { nome: string };
  custo_aquisicao: string;
  preco_venda_atual?: string | null;
  variantes: { quantidade_estoque: number; estoque_minimo_alerta: number }[];
};
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ProdutosPage() {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/api/produtos");
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
    async function loadProducts() {
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch("/api/produtos");
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
    void loadProducts();
  }, []);
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
  return (
    <div className="min-h-screen p-8 bg-[#bfdbfe]">
      <div className="bg-[#1E3A8A] rounded-[32px] p-8 max-w-[1200px] mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Inventário de Peças
            </h1>
            <p className="mt-1 text-white/70">
              Gerencie o seu catálogo e estoque.
            </p>
          </div>
          <Link
            href="/produtos/novo"
            className="bg-[#0080ff] hover:bg-blue-500 text-white font-bold rounded-xl px-6 py-3 flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Produto
          </Link>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/20 p-4 text-red-100">
            {error}{" "}
            <button onClick={load} className="underline">
              Tentar novamente
            </button>
          </div>
        )}
        <div className="bg-[#0F172A] rounded-3xl p-6 overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 text-sm text-white/70">
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Estoque</th>
                <th className="p-4">Preço Venda</th>
                <th className="p-4">Lucro</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/70">
                    Carregando…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/70">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const [label, color] = status(product);
                  const price = Number(product.preco_venda_atual || 0);
                  const profit = price - Number(product.custo_aquisicao);
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-white/5 text-white/90"
                    >
                      <td className="p-4">{product.nome}</td>
                      <td className="p-4">{product.categoria?.nome || "—"}</td>
                      <td className="p-4">{stock(product)}</td>
                      <td className="p-4">
                        {product.preco_venda_atual ? money.format(price) : "—"}
                      </td>
                      <td className="p-4 text-emerald-400">
                        {product.preco_venda_atual ? money.format(profit) : "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm ${color}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link
                            aria-label={`Editar ${product.nome}`}
                            href={`/produtos/${product.id}`}
                            className="text-blue-300 hover:text-white"
                          >
                            <Pencil size={18} />
                          </Link>
                          <button
                            aria-label={`Excluir ${product.nome}`}
                            onClick={() => remove(product)}
                            className="text-red-300 hover:text-white"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
