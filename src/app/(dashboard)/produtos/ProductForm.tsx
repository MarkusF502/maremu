"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import {
  CategoriaLoja,
  CategoriaPai,
  fetchTaxonomia,
  mensagemDeErro,
  nomeDaClassificacao,
  rotuloDaCategoria,
} from "@/src/lib/taxonomia";
import CurrencyInput from "@/src/components/CurrencyInput";
import TaxonomiaSelects from "@/src/components/TaxonomiaSelects";
import PricingModal from "./PricingModal";

type Category = CategoriaLoja;
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

// ─────────────────────────────────────────────────────────────────────

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-[7px] bg-[#eef4ff] text-[11.5px] font-extrabold text-[#1a3673]">
      {n}
    </span>
  );
}

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
  const [taxonomia, setTaxonomia] = useState<CategoriaPai[]>([]);
  const [novoPaiId, setNovoPaiId] = useState<number | "">("");
  const [novaSubId, setNovaSubId] = useState<number | "">("");
  const [categoryModalError, setCategoryModalError] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [novaVariante, setNovaVariante] = useState<Variante>({
    tamanho: "",
    cor: "",
    quantidade_estoque: 0,
  });
  const [categoryModal, setCategoryModal] = useState(false);
  const [variantModal, setVariantModal] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [precoPisoExibido, setPrecoPisoExibido] = useState("");
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
        const [categoriesResponse, taxonomiaData, productResponse] = await Promise.all([
          apiFetch("/api/categorias"),
          fetchTaxonomia(),
          productId
            ? apiFetch(`/api/produtos/${productId}`)
            : Promise.resolve(null),
        ]);
        if (!categoriesResponse.ok)
          throw new Error("Não foi possível carregar as categorias.");
        const categoryData = await categoriesResponse.json();
        setCategories(categoryData.categorias);
        setTaxonomia(taxonomiaData);
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

  function abrirModalDeCategoria() {
    setNovaCategoria("");
    setNovoPaiId("");
    setNovaSubId("");
    setCategoryModalError("");
    setCategoryModal(true);
  }

  async function createCategory() {
    const pai = taxonomia.find((item) => item.id === novoPaiId);
    const sub = pai?.sub_categorias.find((item) => item.id === novaSubId);
    if (!pai || !sub) return;

    // Sem nome próprio, a categoria herda o nome da classificação escolhida.
    const nomeDaCategoria = novaCategoria.trim() || nomeDaClassificacao(pai, sub);

    setCategoryModalError("");
    setSavingCategory(true);
    try {
      const response = await apiFetch("/api/categorias", {
        method: "POST",
        body: JSON.stringify({ nome: nomeDaCategoria, sub_categoria_id: sub.id }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setCategoryModalError(
          mensagemDeErro(body, "Não foi possível criar a categoria."),
        );
        return;
      }
      const { categoria }: { categoria: Category } = await response.json();
      setCategories((current) => [...current, categoria]);
      setCategoriaId(categoria.id);
      setCategoryModal(false);
    } catch {
      setCategoryModalError("Não foi possível criar a categoria.");
    } finally {
      setSavingCategory(false);
    }
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
        setPrecoPisoExibido(
          Number(createdProduct.preco_piso || 0).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        );
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

  if (loading) {
    return (
      <div className="max-w-290 px-8.5 pb-13 pt-7.5 text-sm text-[#64748b]">
        Carregando produto…
      </div>
    );
  }

  const paiEscolhido = taxonomia.find(({ id }) => id === novoPaiId);
  const subEscolhida = paiEscolhido?.sub_categorias.find(({ id }) => id === novaSubId);
  const nomeSugeridoParaCategoria =
    paiEscolhido && subEscolhida ? nomeDaClassificacao(paiEscolhido, subEscolhida) : "";
  const categoriaSelecionada = categories.find(({ id }) => id === categoriaId);
  const categoriaSemClassificacao =
    Boolean(categoriaSelecionada) && !categoriaSelecionada?.sub_categoria_id;
  const custoTotal = (Number(custo || 0) + Number(freteUnitario || 0)) || 0;
  const totalUnidades = variantes.reduce((total, v) => total + Number(v.quantidade_estoque || 0), 0);

  return (
    <div className="max-w-290 px-8.5 pb-13 pt-7.5 mm-screen-in">
      <div className="mb-5.5">
        <p className="text-xs font-bold uppercase tracking-[.09em] text-[#0080ff]">Cadastro</p>
        <h1 className="mt-1.5 text-[29px] font-extrabold tracking-tight text-[#0f172a]">
          {productId ? "Editar produto" : "Novo produto"}
        </h1>
        <p className="mt-1.5 text-sm text-[#64748b]">
          O preço piso é calculado pelo sistema; a IA sugere cenários ao final.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="grid items-start gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) 350px' }}>
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-[#e4eaf4] bg-white p-6.5">
            <h2 className="mb-5 flex items-center gap-2.25 text-[16px] font-bold text-[#0f172a]">
              <Step n={1} />
              Informações do produto
            </h2>
            <label className="block text-[12.5px] font-bold text-[#475569]">
              Nome do produto
              <input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Camiseta Oversized Bege"
                className="mt-2 h-11 w-full rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.5 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,128,255,.14)]"
              />
            </label>
            <div className="mt-4.5 grid grid-cols-3 gap-3.5">
              <label className="block text-[12.5px] font-bold text-[#475569]">
                Categoria
                <select
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="mt-2 h-11 w-full cursor-pointer rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff]"
                >
                  <option value="">Selecione</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {rotuloDaCategoria(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[12.5px] font-bold text-[#475569]">
                Gênero
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="mt-2 h-11 w-full cursor-pointer rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff]"
                >
                  <option>Unissex</option>
                  <option>Masculino</option>
                  <option>Feminino</option>
                </select>
              </label>
              <button
                type="button"
                onClick={abrirModalDeCategoria}
                className="mm-hover flex h-11 items-center justify-center gap-1.75 self-end rounded-[11px] border border-dashed border-[#c9d7ee] text-[13px] font-bold text-[#0080ff] hover:border-[#0080ff] hover:bg-[#f5f9ff]"
              >
                <Plus size={15} strokeWidth={2} />
                Criar categoria
              </button>
            </div>
            {categoriaSemClassificacao && (
              <p className="mm-rise-in mt-3.5 rounded-[11px] border border-[#fde68a] bg-[#fffbeb] px-3.5 py-2.75 text-[12.5px] leading-relaxed text-[#92400e]">
                Esta categoria ainda não foi classificada. Classifique para comparar
                seus preços com lojas semelhantes.{" "}
                <Link href="/categorias" className="font-bold underline">
                  Classificar categorias
                </Link>
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#e4eaf4] bg-white p-6.5">
            <div className="mb-4.5 flex items-center justify-between">
              <h2 className="flex items-center gap-2.25 text-[16px] font-bold text-[#0f172a]">
                <Step n={2} />
                Definição da grade
              </h2>
              <button
                type="button"
                onClick={() => setVariantModal(true)}
                className="mm-hover flex h-9 items-center gap-1.75 rounded-[10px] bg-[#eef4ff] px-3.5 text-[13px] font-bold text-[#1a3673] hover:bg-[#1a3673] hover:text-white"
              >
                <Plus size={15} strokeWidth={2} />
                Adicionar variação
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2.75">
              {variantes.map((variant, index) => (
                <div
                  key={`${variant.tamanho}-${index}`}
                  className="mm-pop-in relative rounded-xl border border-[#e9eff8] bg-[#f8fafd] p-3.5 transition-colors hover:border-[#bfdbfe]"
                >
                  <button
                    type="button"
                    aria-label="Remover variação"
                    onClick={() =>
                      setVariantes((items) =>
                        items.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="mm-hover absolute right-1.75 top-1.75 flex h-5 w-5 items-center justify-center rounded-md text-[#a5b2c6] hover:bg-[#fef2f2] hover:text-red-600"
                  >
                    <X size={12} strokeWidth={2.2} />
                  </button>
                  <p className="pr-4 text-sm font-bold text-[#0f172a]">
                    {variant.tamanho}{variant.cor ? ` · ${variant.cor}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[#64748b]">{variant.quantidade_estoque} un.</p>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setVariantModal(true)}
                className="mm-hover flex min-h-18.5 items-center justify-center rounded-xl border border-dashed border-[#cfdaec] text-[#94a3b8] hover:border-[#0080ff] hover:bg-[#f7fbff] hover:text-[#0080ff]"
              >
                <Plus size={19} strokeWidth={1.7} />
              </button>
            </div>
            <p className="mt-4 text-[12.5px] text-[#8494ad]">
              {variantes.length === 0
                ? "Nenhuma variação adicionada ainda."
                : `${variantes.length} ${variantes.length === 1 ? "variação" : "variações"} · ${totalUnidades} unidades no total`}
            </p>
          </section>
        </div>

        <aside className="sticky rounded-2xl border border-[#e4eaf4] bg-white p-6.5" style={{ top: 82 }}>
          <h2 className="mb-5 flex items-center gap-2.25 text-[16px] font-bold text-[#0f172a]">
            <Step n={3} />
            Custos e preço
          </h2>
          <label className="block text-[12.5px] font-bold text-[#475569]">
            Custo de fábrica
            <div className="mm-hover mt-2 flex h-11 items-center gap-1.75 rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.5 focus-within:border-[#0080ff]">
              <span className="text-[13px] font-bold text-[#94a3b8]">R$</span>
              <CurrencyInput
                required
                value={custo}
                onChange={setCusto}
                placeholder="0,00"
                className="w-full flex-1 border-none bg-transparent text-[15px] font-bold text-[#0f172a] outline-none"
              />
            </div>
          </label>
          <label className="mt-4 block text-[12.5px] font-bold text-[#475569]">
            Frete de entrada unitário
            <div className="mm-hover mt-2 flex h-11 items-center gap-1.75 rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.5 focus-within:border-[#0080ff]">
              <span className="text-[13px] font-bold text-[#94a3b8]">R$</span>
              <CurrencyInput
                required
                value={freteUnitario}
                onChange={setFreteUnitario}
                placeholder="0,00"
                className="w-full flex-1 border-none bg-transparent text-[15px] font-bold text-[#0f172a] outline-none"
              />
            </div>
          </label>

          <div className="mt-5 rounded-[13px] border border-[#e2ebfa] bg-[#f5f8fe] px-4.5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-[#475569]">Custo total unitário</span>
              <span className="text-[15px] font-extrabold text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{money(custoTotal)}</span>
            </div>
            <p className="mt-2.75 text-[11.5px] leading-relaxed text-[#8494ad]">
              O preço piso é calculado pelo sistema a partir da configuração da loja (margem, impostos e taxas) assim que o produto é cadastrado.
            </p>
          </div>

          <button
            type="button"
            role="checkbox"
            aria-checked={jaVendoNaLoja}
            onClick={() => setJaVendoNaLoja((v) => !v)}
            className="mt-4.5 flex items-center gap-2.5 text-left"
          >
            <span
              className={`flex h-4.75 w-4.75 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ${
                jaVendoNaLoja ? "border-[#1a3673] bg-[#1a3673]" : "border-[#cbd5e1] bg-white"
              }`}
            >
              <Check size={12} strokeWidth={3} className={`text-white transition-opacity ${jaVendoNaLoja ? "opacity-100" : "opacity-0"}`} />
            </span>
            <span className="text-[13px] font-semibold text-[#334155]">Já vendo este produto na loja</span>
          </button>

          {jaVendoNaLoja && (
            <label className="mm-rise-in mt-4 block text-[12.5px] font-bold text-[#475569]">
              Preço atual
              <div className="mm-hover mt-2 flex h-11 items-center gap-1.75 rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.5 focus-within:border-[#0080ff]">
                <span className="text-[13px] font-bold text-[#94a3b8]">R$</span>
                <CurrencyInput
                  value={preco}
                  onChange={setPreco}
                  placeholder="0,00"
                  className="w-full flex-1 border-none bg-transparent text-[15px] font-bold text-[#0f172a] outline-none"
                />
              </div>
            </label>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mm-hover mt-5.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0080ff] text-[14.5px] font-bold text-white shadow-[0_10px_22px_-12px_rgba(0,128,255,.95)] hover:-translate-y-px hover:bg-[#1a3673] active:translate-y-0 active:scale-[.985] disabled:opacity-60"
          >
            {saving
              ? "Salvando…"
              : productId
                ? "Salvar alterações"
                : "Cadastrar produto"}
          </button>
        </aside>
      </form>

      {categoryModal && createPortal(
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setCategoryModal(false)}
            className="mm-fade absolute inset-0 bg-[rgba(15,23,42,.4)]"
          />
          <div className="mm-pop-in-centered absolute left-1/2 top-1/2 w-[calc(100%-32px)] max-w-100 -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-white p-6.5 shadow-[0_40px_80px_-30px_rgba(15,23,42,.5)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#0f172a]">Nova categoria</h2>
              <button
                type="button"
                onClick={() => setCategoryModal(false)}
                aria-label="Fechar"
                className="mm-hover flex h-8 w-8 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#f1f5fb]"
              >
                <X size={17} strokeWidth={1.8} />
              </button>
            </div>
            <p className="mb-4.5 text-[12.5px] leading-relaxed text-[#64748b]">
              A classificação é o que permite comparar seus preços com lojas
              semelhantes.
            </p>

            <TaxonomiaSelects
              arvore={taxonomia}
              paiId={novoPaiId}
              subCategoriaId={novaSubId}
              disabled={savingCategory}
              onChange={(paiId, subId) => {
                setNovoPaiId(paiId);
                setNovaSubId(subId);
                setCategoryModalError("");
              }}
            />

            <label className="mt-3.5 block text-[12.5px] font-bold text-[#475569]">
              Nome na sua loja (opcional)
              <input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder={nomeSugeridoParaCategoria || "Ex: Camisetas"}
                className="mt-2 h-11 w-full rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.5 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff] focus:shadow-[0_0_0_3px_rgba(0,128,255,.14)]"
              />
            </label>
            {nomeSugeridoParaCategoria && (
              <p className="mt-2 text-[11.5px] text-[#8494ad]">
                Em branco, a categoria fica com o nome “{nomeSugeridoParaCategoria}”.
              </p>
            )}

            {categoryModalError && (
              <p className="mm-rise-in mt-4 rounded-[11px] border border-red-200 bg-red-50 px-3.5 py-2.75 text-[12.5px] text-red-700">
                {categoryModalError}
              </p>
            )}

            <button
              type="button"
              onClick={createCategory}
              disabled={!novaSubId || savingCategory}
              className="mm-hover mt-5 w-full rounded-xl bg-[#1a3673] py-3 text-center text-sm font-bold text-white hover:bg-[#0080ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCategory ? "Salvando…" : "Salvar categoria"}
            </button>
          </div>
        </div>,
        document.body,
      )}

      {variantModal && createPortal(
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setVariantModal(false)}
            className="mm-fade absolute inset-0 bg-[rgba(15,23,42,.4)]"
          />
          <div className="mm-pop-in-centered absolute left-1/2 top-1/2 w-[calc(100%-32px)] max-w-105 -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-white p-6.5 shadow-[0_40px_80px_-30px_rgba(15,23,42,.5)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#0f172a]">Nova variação</h2>
              <button
                type="button"
                onClick={() => setVariantModal(false)}
                aria-label="Fechar"
                className="mm-hover flex h-8 w-8 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#f1f5fb]"
              >
                <X size={17} strokeWidth={1.8} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[12.5px] font-bold text-[#475569]">
                Tamanho
                <input
                  value={novaVariante.tamanho}
                  onChange={(e) => setNovaVariante((v) => ({ ...v, tamanho: e.target.value }))}
                  placeholder="P, M, G, 38…"
                  className="mt-2 h-11 w-full rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.25 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff] focus:shadow-[0_0_0_3px_rgba(0,128,255,.14)]"
                />
              </label>
              <label className="text-[12.5px] font-bold text-[#475569]">
                Cor
                <input
                  value={novaVariante.cor}
                  onChange={(e) => setNovaVariante((v) => ({ ...v, cor: e.target.value }))}
                  placeholder="Bege"
                  className="mt-2 h-11 w-full rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.25 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff] focus:shadow-[0_0_0_3px_rgba(0,128,255,.14)]"
                />
              </label>
              <label className="col-span-2 text-[12.5px] font-bold text-[#475569]">
                Quantidade em estoque
                <input
                  type="number"
                  min={0}
                  value={novaVariante.quantidade_estoque}
                  onChange={(e) => setNovaVariante((v) => ({ ...v, quantidade_estoque: Number(e.target.value) }))}
                  placeholder="0"
                  className="mt-2 h-11 w-full rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.25 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff] focus:shadow-[0_0_0_3px_rgba(0,128,255,.14)]"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="mm-hover mt-5 w-full rounded-xl bg-[#1a3673] py-3 text-center text-sm font-bold text-white hover:bg-[#0080ff]"
            >
              Adicionar à grade
            </button>
          </div>
        </div>,
        document.body,
      )}

      {priceModalOpen && (
        <PricingModal
          precoPiso={precoPisoExibido}
          cenarios={cenarios}
          cenarioEscolhido={cenarioEscolhido}
          loading={loadingCenarios}
          preco={preco}
          error={priceModalError || cenariosError}
          saving={savingPrice}
          onPickCenario={selecionarCenario}
          onPrecoChange={editarManualmente}
          onRecarregar={() => {
            setCenarioEscolhido("manual");
            setPreco("");
            if (createdProductId) fetchCenarios(createdProductId);
          }}
          onSalvar={persistEditedPrice}
          close={() => setPriceModalOpen(false)}
        />
      )}
    </div>
  );
}
