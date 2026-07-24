"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { apiFetch } from "@/src/lib/api";

type Category = { id: string; nome: string };
type Variante = { tamanho: string; cor: string; quantidade_estoque: number };
type Produto = {
  id: string;
  nome: string;
  categoria_id: string;
  genero?: string | null;
  custo_aquisicao: string;
  frete_entrada_unitario: string;
  preco_piso: string;
  preco_venda_atual?: string | null;
  variantes: Variante[];
};

// ── NOVO: tipos do retorno de /precificacao/sugerir ────────────────────
type CenarioIA = {
  id: "cenario_1" | "cenario_2" | "cenario_3";
  tipo: "liquidacao" | "ideal" | "alta_demanda";
  preco_sugerido: number;
  explicacao: string;
};

const TIPO_LABEL: Record<CenarioIA["tipo"], string> = {
  liquidacao: "Liquidação",
  ideal: "Venda ideal",
  alta_demanda: "Alta demanda",
};
// ─────────────────────────────────────────────────────────────────────

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nome, setNome] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [genero, setGenero] = useState("Unissex");
  const [custo, setCusto] = useState("");
  const [freteUnitario, setFreteUnitario] = useState("0.00");
  const [jaVendoNaLoja, setJaVendoNaLoja] = useState(false);
  const [preco, setPreco] = useState("");
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaVariante, setNovaVariante] = useState<Variante>({
    tamanho: "",
    cor: "",
    quantidade_estoque: 0,
  });
  const [categoryModal, setCategoryModal] = useState(false);
  const [variantModal, setVariantModal] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [error, setError] = useState("");
  const [priceModalError, setPriceModalError] = useState("");

  // ── NOVO: estado das sugestões da IA ──────────────────────────────
  const [cenarios, setCenarios] = useState<CenarioIA[]>([]);
  const [logId, setLogId] = useState<string | null>(null);
  const [cenarioEscolhido, setCenarioEscolhido] = useState<string>("manual");
  const [loadingCenarios, setLoadingCenarios] = useState(false);
  const [cenariosError, setCenariosError] = useState("");
  // ────────────────────────────────────────────────────────────────

  function buildProductPayload(precoVendaAtual?: string) {
    return {
      nome,
      categoria_id: categoriaId,
      genero,
      custo_aquisicao: Number(custo),
      frete_entrada_unitario: Number(freteUnitario),
      ...(precoVendaAtual !== undefined && precoVendaAtual !== ""
        ? { preco_venda_atual: Number(precoVendaAtual) }
        : {}),
      variantes,
    };
  }

  useEffect(() => {
    async function load() {
      try {
        const [categoriesResponse, productResponse] = await Promise.all([
          apiFetch("/api/categorias"),
          productId
            ? apiFetch(`/api/produtos/${productId}`)
            : Promise.resolve(null),
        ]);
        if (!categoriesResponse.ok)
          throw new Error("Não foi possível carregar as categorias.");
        const categoryData = await categoriesResponse.json();
        setCategories(categoryData.categorias);
        if (productResponse) {
          if (!productResponse.ok) throw new Error("Produto não encontrado.");
          const { produto }: { produto: Produto } =
            await productResponse.json();
          setNome(produto.nome);
          setCategoriaId(produto.categoria_id);
          setGenero(produto.genero || "Unissex");
          setCusto(produto.custo_aquisicao);
          setFreteUnitario(produto.frete_entrada_unitario);
          setPreco(produto.preco_venda_atual || "");
          setJaVendoNaLoja(
            produto.preco_venda_atual !== null &&
              produto.preco_venda_atual !== undefined,
          );
          setVariantes(produto.variantes);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar dados.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  async function createCategory() {
    if (!novaCategoria.trim()) return;
    const response = await apiFetch("/api/categorias", {
      method: "POST",
      body: JSON.stringify({ nome: novaCategoria.trim() }),
    });
    if (!response.ok) {
      setError("Não foi possível criar a categoria.");
      return;
    }
    const { categoria } = await response.json();
    setCategories((current) => [...current, categoria]);
    setCategoriaId(categoria.id);
    setNovaCategoria("");
    setCategoryModal(false);
  }

  // ── NOVO: busca as sugestões assim que o produto é criado ────────
  async function fetchCenarios(productId: string) {
    setLoadingCenarios(true);
    setCenariosError("");
    try {
      const response = await apiFetch(`/api/precificacao/sugerir/${productId}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(
          "Não foi possível gerar sugestões de preço agora. Você ainda pode definir manualmente.",
        );
      }
      const data: { log_id: string; cenarios: CenarioIA[] } = await response.json();
      setLogId(data.log_id);
      setCenarios(data.cenarios);
    } catch (err) {
      setCenariosError(
        err instanceof Error ? err.message : "Erro ao buscar sugestões da IA.",
      );
    } finally {
      setLoadingCenarios(false);
    }
  }

  function selecionarCenario(cenario: CenarioIA) {
    setCenarioEscolhido(cenario.id);
    setPreco(String(cenario.preco_sugerido));
    setPriceModalError("");
  }

  function editarManualmente(valor: string) {
    setCenarioEscolhido("manual");
    setPreco(valor);
  }
  // ──────────────────────────────────────────────────────────────

  // ── ALTERADO: agora confirma via /precificacao/confirmar em vez de PUT direto ──
  async function persistEditedPrice() {
    if (!createdProductId) return;

    if (!preco.trim()) {
      setPriceModalError("Informe um preço de venda.");
      return;
    }

    // Se o usuário escolheu um cenário da IA, precisamos do log_id para confirmar.
    // Se está editando manualmente, log_id pode existir (para registrar que a IA
    // sugeriu algo mas o lojista optou por outro valor) ou não (IA falhou).
    if (cenarioEscolhido !== "manual" && !logId) {
      setPriceModalError("Não foi possível validar a sugestão da IA. Recarregue e tente novamente.");
      return;
    }

    setPriceModalError("");
    setSavingPrice(true);

    try {
      const response = logId
        ? await apiFetch("/api/precificacao/confirmar", {
            method: "POST",
            body: JSON.stringify({
              log_id: logId,
              cenario_escolhido: cenarioEscolhido,
              preco_final: Number(preco),
            }),
          })
        : // fallback: IA não gerou log (ex: falha na chamada) — salva preço direto no produto
          await apiFetch(`/api/produtos/${createdProductId}`, {
            method: "PUT",
            body: JSON.stringify(buildProductPayload(preco)),
          });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Não foi possível salvar o preço.");
      }

      setPriceModalOpen(false);
      router.push("/produtos");
      router.refresh();
    } catch (err) {
      setPriceModalError(
        err instanceof Error ? err.message : "Não foi possível salvar o preço.",
      );
    } finally {
      setSavingPrice(false);
    }
  }

  function addVariant() {
    if (!novaVariante.tamanho.trim()) {
      setError("Informe o tamanho da variação.");
      return;
    }
    setVariantes((current) => [...current, novaVariante]);
    setNovaVariante({ tamanho: "", cor: "", quantidade_estoque: 0 });
    setVariantModal(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!categoriaId) {
      setError("Selecione uma categoria.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch(
        productId ? `/api/produtos/${productId}` : "/api/produtos",
        {
          method: productId ? "PUT" : "POST",
          body: JSON.stringify(
            buildProductPayload(jaVendoNaLoja && preco ? preco : undefined),
          ),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Não foi possível salvar o produto.");
      }

      if (!productId) {
        const createdProduct: Produto = await response.json();
        setCreatedProductId(createdProduct.id);
        setPreco(
          createdProduct.preco_piso || createdProduct.preco_venda_atual || "",
        );
        setPriceModalError("");
        setPriceModalOpen(true);
        fetchCenarios(createdProduct.id); // ← NOVO: dispara a busca das sugestões
        return;
      }

      router.push("/produtos");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o produto.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Carregando produto…</div>;
  return (
    <div className="min-h-screen p-8 bg-[#bfdbfe]">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">
        {productId ? "Editar Produto" : "Novo Produto"}
      </h1>
      <form
        onSubmit={submit}
        className="max-w-[1200px] bg-[#1E3A8A] rounded-[32px] p-8 text-white grid md:grid-cols-[1fr_380px] gap-8"
      >
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Informações do Produto</h2>
          {error && (
            <p className="rounded-xl bg-red-500/20 p-3 text-red-100">{error}</p>
          )}
          <label className="block text-sm">
            Nome do Produto
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-2 w-full bg-[#0F172A] rounded-xl p-4"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-6">
            <label className="block text-sm">
              Categoria
              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="mt-2 w-full bg-[#0F172A] rounded-xl p-4"
              >
                <option value="">Selecione</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nome}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setCategoryModal(true)}
              className="self-end rounded-xl border border-white/30 p-4 text-left hover:bg-white/10"
            >
              + Criar categoria
            </button>
            <label className="block text-sm">
              Gênero
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                className="mt-2 w-full bg-[#0F172A] rounded-xl p-4"
              >
                <option>Masculino</option>
                <option>Feminino</option>
                <option>Unissex</option>
              </select>
            </label>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold">Definição da Grade</h2>
              <button
                type="button"
                onClick={() => setVariantModal(true)}
                className="flex items-center gap-1 text-blue-300"
              >
                <Plus size={18} /> Adicionar
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {variantes.map((variant, index) => (
                <div
                  key={`${variant.tamanho}-${index}`}
                  className="rounded-xl bg-[#0F172A] p-4 relative"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setVariantes((items) =>
                        items.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="absolute right-2 top-2 text-white/60 hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                  <p className="font-bold">
                    {variant.tamanho} {variant.cor && `• ${variant.cor}`}
                  </p>
                  <p className="text-sm text-white/70">
                    {variant.quantidade_estoque} un.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <aside className="rounded-[28px] bg-[#172554] p-6 flex flex-col gap-6">
          <h2 className="text-xl font-bold">Preço</h2>
          <label className="text-sm">
            Custo de Fábrica
            <input
              required
              min="0"
              type="number"
              step="0.01"
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              className="mt-2 w-full bg-[#0F172A] rounded-xl p-4"
            />
          </label>
          <label className="text-sm">
            Custo do frete unitário
            <input
              required
              min="0"
              type="number"
              step="0.01"
              value={freteUnitario}
              onChange={(e) => setFreteUnitario(e.target.value)}
              className="mt-2 w-full bg-[#0F172A] rounded-xl p-4"
            />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={jaVendoNaLoja}
              onChange={(e) => setJaVendoNaLoja(e.target.checked)}
              className="size-4 rounded border-white/30 bg-[#0F172A]"
            />
            Já vendo este produto em minha loja
          </label>
          {jaVendoNaLoja && (
            <label className="text-sm">
              Preço atual
              <input
                min="0"
                type="number"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="mt-2 w-full bg-[#0F172A] rounded-xl p-4"
              />
            </label>
          )}
          <button
            disabled={saving}
            className="mt-auto bg-[#0080ff] disabled:opacity-60 rounded-xl py-4 font-bold"
          >
            {saving
              ? "Salvando…"
              : productId
                ? "Salvar alterações"
                : "Cadastrar Produto"}
          </button>
        </aside>
      </form>
      {categoryModal && (
        <Modal title="Nova Categoria" close={() => setCategoryModal(false)}>
          <input
            autoFocus
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            placeholder="Ex: Camisetas"
            className="w-full bg-[#0F172A] rounded-xl p-4"
          />
          <button
            type="button"
            onClick={createCategory}
            className="mt-4 w-full bg-[#2563EB] rounded-xl py-3 font-bold"
          >
            Salvar
          </button>
        </Modal>
      )}
      {variantModal && (
        <Modal title="Nova Variação" close={() => setVariantModal(false)}>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={novaVariante.tamanho}
              onChange={(e) =>
                setNovaVariante((v) => ({ ...v, tamanho: e.target.value }))
              }
              placeholder="Tamanho"
              className="bg-[#0F172A] rounded-xl p-4"
            />
            <input
              value={novaVariante.cor}
              onChange={(e) =>
                setNovaVariante((v) => ({ ...v, cor: e.target.value }))
              }
              placeholder="Cor"
              className="bg-[#0F172A] rounded-xl p-4"
            />
            <input
              type="number"
              min="0"
              value={novaVariante.quantidade_estoque}
              onChange={(e) =>
                setNovaVariante((v) => ({
                  ...v,
                  quantidade_estoque: Number(e.target.value),
                }))
              }
              placeholder="Quantidade"
              className="col-span-2 bg-[#0F172A] rounded-xl p-4"
            />
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="mt-4 w-full bg-[#2563EB] rounded-xl py-3 font-bold"
          >
            Adicionar
          </button>
        </Modal>
      )}
      {priceModalOpen && (
        <Modal title="Ajustar preço de venda" close={() => setPriceModalOpen(false)}>
          <p className="mb-4 text-sm text-white/70">
            O preço piso foi calculado pelo sistema. Veja as sugestões da IA
            abaixo ou ajuste manualmente.
          </p>

          {/* ── NOVO: bloco de cenários da IA ──────────────────────── */}
          {loadingCenarios && (
            <p className="mb-4 text-sm text-white/60">Gerando sugestões de preço…</p>
          )}
          {cenariosError && (
            <p className="mb-4 rounded-xl bg-amber-500/20 p-3 text-amber-100 text-sm">
              {cenariosError}
            </p>
          )}
          {cenarios.length > 0 && (
            <div className="mb-5 space-y-2">
              {cenarios.map((cenario) => (
                <button
                  key={cenario.id}
                  type="button"
                  onClick={() => selecionarCenario(cenario)}
                  className={`w-full rounded-xl p-4 text-left transition ${
                    cenarioEscolhido === cenario.id
                      ? "bg-[#2563EB] ring-2 ring-blue-300"
                      : "bg-[#0F172A] hover:bg-[#0F172A]/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{TIPO_LABEL[cenario.tipo]}</span>
                    <span className="font-bold">
                      R$ {cenario.preco_sugerido.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/70">{cenario.explicacao}</p>
                </button>
              ))}
            </div>
          )}
          {/* ──────────────────────────────────────────────────────── */}

          {priceModalError && (
            <p className="mb-4 rounded-xl bg-red-500/20 p-3 text-red-100">
              {priceModalError}
            </p>
          )}
          <label className="block text-sm">
            {cenarios.length > 0 ? "Ou defina manualmente" : "Preço de venda"}
            <input
              autoFocus={cenarios.length === 0}
              required
              min="0"
              type="number"
              step="0.01"
              value={preco}
              onChange={(e) => editarManualmente(e.target.value)}
              className="mt-2 w-full rounded-xl bg-[#0F172A] p-4"
            />
          </label>
          <button
            type="button"
            onClick={persistEditedPrice}
            disabled={savingPrice}
            className="mt-4 w-full rounded-xl bg-[#2563EB] py-3 font-bold disabled:opacity-60"
          >
            {savingPrice ? "Salvando preço…" : "Salvar preço e continuar"}
          </button>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/60"
        onClick={close}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-[#1E3A8A] p-6 text-white">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}