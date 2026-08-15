"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import CurrencyInput from "@/src/components/CurrencyInput";

type VarianteCatalogo = {
  id: string;
  tamanho: string;
  quantidade_estoque: number;
  estoque_minimo_alerta: number;
};

type ProdutoCatalogo = {
  id: string;
  nome: string;
  sku: string | null;
  categoria: string;
  status: "ativo" | "liquidacao";
  preco_venda_atual: number;
  estoque_total: number;
  variantes: VarianteCatalogo[];
};

type ItemCarrinho = {
  variante_id: string;
  produto_id: string;
  nome: string;
  tamanho: string;
  preco: number;
  estoque_disponivel: number;
  quantidade: number;
};

type ItemPedido = {
  produto_id: string;
  variante_id: string | null;
  produto: string;
  tamanho: string | null;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  total: number;
};

type Pedido = {
  id: string;
  canal_venda: string;
  forma_pagamento: string | null;
  data_venda: string;
  subtotal: number;
  desconto: number;
  valor_total: number;
  quantidade_itens: number;
  itens: ItemPedido[];
};

type HistoricoResponse = {
  resumo_hoje: {
    quantidade_vendas: number;
    faturamento: number;
  };
  pedidos: Pedido[];
};

type VendaResponse = {
  message: string;
  pedido: Pedido;
};

const CANAIS = [
  { value: "loja_fisica", label: "Loja física" },
  { value: "instagram_whatsapp", label: "Instagram / WhatsApp" },
  { value: "marketplace", label: "Marketplace" },
  { value: "outro", label: "Outro" },
];

const FORMAS_PAGAMENTO = [
  "PIX",
  "Dinheiro",
  "Cartão de débito",
  "Cartão de crédito",
  "Transferência",
  "Outro",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function getApiError(response: Response) {
  const data = await response.json().catch(() => null) as {
    message?: string;
    errors?: Record<string, string[]>;
  } | null;

  const firstValidationError = data?.errors
    ? Object.values(data.errors).flat().find(Boolean)
    : undefined;

  return firstValidationError ?? data?.message ?? "Não foi possível concluir a operação.";
}

function shortOrderId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export default function PDVPage() {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [historico, setHistorico] = useState<HistoricoResponse>({
    resumo_hoje: { quantidade_vendas: 0, faturamento: 0 },
    pedidos: [],
  });
  const [busca, setBusca] = useState("");
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<string | null>(null);
  const [varianteSelecionadaId, setVarianteSelecionadaId] = useState<string | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [canalVenda, setCanalVenda] = useState("loja_fisica");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [desconto, setDesconto] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregarDados = useCallback(async (silencioso = false) => {
    if (silencioso) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }

    setErro(null);

    try {
      const [catalogoResponse, historicoResponse] = await Promise.all([
        apiFetch("/api/saidas/catalogo"),
        apiFetch("/api/saidas?limit=10"),
      ]);

      if (!catalogoResponse.ok) {
        throw new Error(await getApiError(catalogoResponse));
      }

      if (!historicoResponse.ok) {
        throw new Error(await getApiError(historicoResponse));
      }

      const catalogoData = await catalogoResponse.json() as { produtos: ProdutoCatalogo[] };
      const historicoData = await historicoResponse.json() as HistoricoResponse;

      setProdutos(catalogoData.produtos ?? []);
      setHistorico(historicoData);

      setProdutoSelecionadoId((atual) => {
        const aindaExiste = catalogoData.produtos.some((produto) => produto.id === atual);
        return aindaExiste ? atual : catalogoData.produtos[0]?.id ?? null;
      });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar os dados do ponto de venda.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const produtosFiltrados = useMemo(() => {
    const termo = normalizeText(busca.trim());

    if (!termo) return produtos;

    return produtos.filter((produto) => {
      const texto = normalizeText(
        `${produto.nome} ${produto.sku ?? ""} ${produto.categoria}`,
      );
      return texto.includes(termo);
    });
  }, [busca, produtos]);

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === produtoSelecionadoId) ?? null,
    [produtoSelecionadoId, produtos],
  );

  useEffect(() => {
    if (!produtoSelecionado) {
      setVarianteSelecionadaId(null);
      return;
    }

    const selecionadaAindaPertence = produtoSelecionado.variantes.some(
      (variante) => variante.id === varianteSelecionadaId,
    );

    if (!selecionadaAindaPertence) {
      const primeiraDisponivel = produtoSelecionado.variantes.find(
        (variante) => variante.quantidade_estoque > 0,
      );
      setVarianteSelecionadaId(
        primeiraDisponivel?.id ?? produtoSelecionado.variantes[0]?.id ?? null,
      );
    }
  }, [produtoSelecionado, varianteSelecionadaId]);

  const varianteSelecionada = useMemo(
    () => produtoSelecionado?.variantes.find(
      (variante) => variante.id === varianteSelecionadaId,
    ) ?? null,
    [produtoSelecionado, varianteSelecionadaId],
  );

  const subtotal = useMemo(
    () => carrinho.reduce((total, item) => total + item.preco * item.quantidade, 0),
    [carrinho],
  );

  const descontoNumerico = Number.parseFloat(desconto.replace(",", ".")) || 0;
  const descontoAplicado = Math.min(Math.max(descontoNumerico, 0), subtotal);
  const total = Math.max(subtotal - descontoAplicado, 0);
  const quantidadeItens = carrinho.reduce((totalItens, item) => totalItens + item.quantidade, 0);

  const quantidadeNoCarrinho = useCallback((varianteId: string) => {
    return carrinho.find((item) => item.variante_id === varianteId)?.quantidade ?? 0;
  }, [carrinho]);

  const adicionarAoCarrinho = () => {
    if (!produtoSelecionado || !varianteSelecionada) {
      setErro("Selecione um produto e uma variação.");
      return;
    }

    const quantidadeAtual = quantidadeNoCarrinho(varianteSelecionada.id);

    if (quantidadeAtual >= varianteSelecionada.quantidade_estoque) {
      setErro("Não há mais unidades disponíveis dessa variação.");
      return;
    }

    setCarrinho((atual) => {
      const existente = atual.find((item) => item.variante_id === varianteSelecionada.id);

      if (existente) {
        return atual.map((item) => item.variante_id === varianteSelecionada.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item);
      }

      return [
        ...atual,
        {
          variante_id: varianteSelecionada.id,
          produto_id: produtoSelecionado.id,
          nome: produtoSelecionado.nome,
          tamanho: varianteSelecionada.tamanho,
          preco: produtoSelecionado.preco_venda_atual,
          estoque_disponivel: varianteSelecionada.quantidade_estoque,
          quantidade: 1,
        },
      ];
    });

    setErro(null);
    setSucesso(null);
  };

  const alterarQuantidade = (varianteId: string, delta: number) => {
    setCarrinho((atual) => atual.flatMap((item) => {
      if (item.variante_id !== varianteId) return [item];

      const novaQuantidade = item.quantidade + delta;
      if (novaQuantidade <= 0) return [];

      return [{
        ...item,
        quantidade: Math.min(novaQuantidade, item.estoque_disponivel),
      }];
    }));
  };

  const removerItem = (varianteId: string) => {
    setCarrinho((atual) => atual.filter((item) => item.variante_id !== varianteId));
  };

  const finalizarVenda = useCallback(async () => {
    if (carrinho.length === 0 || finalizando) {
      if (carrinho.length === 0) setErro("Adicione pelo menos um produto ao carrinho.");
      return;
    }

    if (!formaPagamento.trim()) {
      setErro("Selecione a forma de pagamento.");
      return;
    }

    setFinalizando(true);
    setErro(null);
    setSucesso(null);

    try {
      const response = await apiFetch("/api/saidas", {
        method: "POST",
        body: JSON.stringify({
          canal_venda: canalVenda,
          forma_pagamento: formaPagamento,
          desconto: descontoAplicado,
          itens: carrinho.map((item) => ({
            variante_id: item.variante_id,
            quantidade: item.quantidade,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const data = await response.json() as VendaResponse;

      setCarrinho([]);
      setDesconto("");
      setSucesso(
        `Venda ${shortOrderId(data.pedido.id)} concluída: ${formatCurrency(data.pedido.valor_total)}.`,
      );
      await carregarDados(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível finalizar a venda.");
    } finally {
      setFinalizando(false);
    }
  }, [canalVenda, carregarDados, carrinho, descontoAplicado, finalizando, formaPagamento]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        void finalizarVenda();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [finalizarVenda]);

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-700">
        <Loader2 className="mr-3 animate-spin" size={28} />
        Carregando produtos e saídas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#bfdbfe] p-4 sm:p-6 lg:p-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Fluxo de Saídas</h1>
          <p className="mt-2 text-sm text-slate-600">
            Venda registrada no banco e baixa automática do estoque.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendas hoje</p>
            <p className="text-xl font-bold text-[#102356]">{historico.resumo_hoje.quantidade_vendas}</p>
          </div>
          <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Faturamento hoje</p>
            <p className="text-xl font-bold text-[#102356]">{formatCurrency(historico.resumo_hoje.faturamento)}</p>
          </div>
          <button
            type="button"
            onClick={() => void carregarDados(true)}
            disabled={atualizando}
            className="flex h-12 items-center gap-2 rounded-xl bg-white px-4 font-semibold text-[#17387c] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={18} className={atualizando ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </div>

      {(erro || sucesso) && (
        <div
          className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
            erro
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {erro ? <AlertCircle size={20} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={20} className="mt-0.5 shrink-0" />}
          <span>{erro ?? sucesso}</span>
        </div>
      )}

      <div className="grid max-w-[1500px] grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <section className="rounded-[30px] bg-[#1e3a8a] p-5 text-white shadow-xl sm:p-7 xl:col-span-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Adicionar produto</h2>
              <p className="mt-1 text-xs text-blue-100/70">Selecione um item real do estoque cadastrado.</p>
            </div>
            <span className="rounded-full bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-blue-100">
              {produtos.length} produtos
            </span>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45" size={20} />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, SKU ou categoria"
              className="w-full rounded-xl bg-[#0f172a] py-4 pl-12 pr-4 text-white outline-none ring-blue-400 placeholder:text-white/35 focus:ring-2"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <div className="mb-5 max-h-64 space-y-2 overflow-y-auto pr-1">
                {produtosFiltrados.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-[#0f172a]/60 p-8 text-center text-sm text-white/55">
                    Nenhum produto encontrado.
                  </div>
                ) : produtosFiltrados.map((produto) => {
                  const ativo = produto.id === produtoSelecionadoId;
                  return (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => setProdutoSelecionadoId(produto.id)}
                      className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
                        ativo
                          ? "border-blue-300 bg-blue-500/25"
                          : "border-white/5 bg-[#0f172a]/80 hover:border-white/15 hover:bg-[#0f172a]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{produto.nome}</p>
                        <p className="mt-1 truncate text-xs text-white/45">
                          {produto.categoria}{produto.sku ? ` • SKU ${produto.sku}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-blue-200">{formatCurrency(produto.preco_venda_atual)}</p>
                        <p className={`mt-1 text-xs ${produto.estoque_total > 0 ? "text-emerald-300" : "text-red-300"}`}>
                          {produto.estoque_total} un.
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <h3 className="mb-3 font-bold text-white/90">Variação selecionada</h3>
              <div className="flex min-h-24 flex-wrap gap-3">
                {produtoSelecionado?.variantes.map((variante) => {
                  const ativo = variante.id === varianteSelecionadaId;
                  const quantidadeCarrinho = quantidadeNoCarrinho(variante.id);
                  const disponivel = variante.quantidade_estoque - quantidadeCarrinho;
                  const esgotada = disponivel <= 0;

                  return (
                    <button
                      key={variante.id}
                      type="button"
                      onClick={() => setVarianteSelecionadaId(variante.id)}
                      className={`relative min-w-28 rounded-xl border px-4 py-3 text-left transition ${
                        ativo
                          ? "border-blue-300 bg-blue-500/25"
                          : "border-white/5 bg-[#0f172a] hover:border-white/15"
                      } ${esgotada ? "opacity-55" : ""}`}
                    >
                      <p className="text-sm font-bold">Tam. {variante.tamanho}</p>
                      <p className={`mt-1 text-xs ${esgotada ? "text-red-300" : "text-emerald-300"}`}>
                        {esgotada ? "Sem saldo" : `${disponivel} disponível(is)`}
                      </p>
                      {quantidadeCarrinho > 0 && (
                        <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-400 px-1 text-[11px] font-bold text-white">
                          {quantidadeCarrinho}
                        </span>
                      )}
                    </button>
                  );
                })}

                {produtoSelecionado && produtoSelecionado.variantes.length === 0 && (
                  <p className="text-sm text-white/50">Este produto não possui variações cadastradas.</p>
                )}
              </div>
            </div>

            <div className="flex min-h-[360px] flex-col rounded-[24px] border border-white/5 bg-[#0f172a] p-6 shadow-lg">
              <div className="mb-5 flex h-36 items-center justify-center rounded-xl bg-white/5">
                <Package className="text-white/20" size={58} />
              </div>

              {produtoSelecionado ? (
                <>
                  <span className="mb-2 w-fit rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-semibold text-blue-200">
                    {produtoSelecionado.categoria}
                  </span>
                  <h3 className="text-lg font-bold leading-tight">{produtoSelecionado.nome}</h3>
                  <p className="mt-2 text-2xl font-bold text-blue-300">
                    {formatCurrency(produtoSelecionado.preco_venda_atual)}
                  </p>
                  <div className="mt-4 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/65">
                    {varianteSelecionada
                      ? `Tamanho ${varianteSelecionada.tamanho} • ${varianteSelecionada.quantidade_estoque} em estoque`
                      : "Selecione uma variação"}
                  </div>

                  <button
                    type="button"
                    onClick={adicionarAoCarrinho}
                    disabled={!varianteSelecionada || varianteSelecionada.quantidade_estoque <= quantidadeNoCarrinho(varianteSelecionada.id)}
                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[#0080ff] py-4 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:opacity-70"
                  >
                    <Plus size={20} />
                    Adicionar produto
                  </button>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-center text-sm text-white/45">
                  Selecione um produto para visualizar suas variações.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="flex min-h-[650px] flex-col rounded-[30px] bg-[#0f172a] p-5 text-white shadow-2xl sm:p-7 xl:col-span-4">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart size={22} />
              <h2 className="text-xl font-bold">Carrinho</h2>
            </div>
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-bold text-indigo-200">
              {quantidadeItens} {quantidadeItens === 1 ? "item" : "itens"}
            </span>
          </div>

          <div className="max-h-[330px] flex-1 space-y-3 overflow-y-auto pr-1">
            {carrinho.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-white/35">
                <ShoppingCart size={36} className="mb-3" />
                <p className="text-sm">O carrinho está vazio.</p>
              </div>
            ) : carrinho.map((item) => (
              <div key={item.variante_id} className="rounded-2xl border border-white/5 bg-white/[0.035] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white/90">{item.nome}</p>
                    <p className="mt-1 text-xs text-white/45">Tamanho {item.tamanho}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerItem(item.variante_id)}
                    className="rounded-lg p-1.5 text-white/35 transition hover:bg-red-500/15 hover:text-red-300"
                    aria-label={`Remover ${item.nome}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center rounded-lg bg-[#091122]">
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.variante_id, -1)}
                      className="p-2 text-white/60 hover:text-white"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold">{item.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.variante_id, 1)}
                      disabled={item.quantidade >= item.estoque_disponivel}
                      className="p-2 text-white/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">{formatCurrency(item.preco)} cada</p>
                    <p className="font-bold text-white/90">{formatCurrency(item.preco * item.quantidade)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-white/55">
                Canal da venda
                <select
                  value={canalVenda}
                  onChange={(event) => setCanalVenda(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/5 bg-[#091122] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                >
                  {CANAIS.map((canal) => <option key={canal.value} value={canal.value}>{canal.label}</option>)}
                </select>
              </label>

              <label className="text-xs font-semibold text-white/55">
                Pagamento
                <select
                  value={formaPagamento}
                  onChange={(event) => setFormaPagamento(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/5 bg-[#091122] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                >
                  {FORMAS_PAGAMENTO.map((forma) => <option key={forma} value={forma}>{forma}</option>)}
                </select>
              </label>
            </div>

            <label className="block text-xs font-semibold text-white/55">
              Desconto total
              <div className="mt-1.5 flex items-center rounded-xl border border-white/5 bg-[#091122] px-3 focus-within:border-blue-400">
                <span className="text-sm text-white/40">R$</span>
                <CurrencyInput
                  max={subtotal}
                  value={desconto}
                  onChange={setDesconto}
                  className="w-full bg-transparent px-2 py-2.5 text-sm text-white outline-none"
                />
              </div>
            </label>

            <div className="space-y-2 pt-1 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-red-300">
                <span>Desconto</span>
                <span>- {formatCurrency(descontoAplicado)}</span>
              </div>
              <div className="flex items-end justify-between border-t border-white/10 pt-3">
                <span className="font-bold tracking-wide">TOTAL</span>
                <span className="text-3xl font-bold">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void finalizarVenda()}
              disabled={carrinho.length === 0 || finalizando}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-4 text-lg font-bold tracking-wide text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
            >
              {finalizando ? <Loader2 size={21} className="animate-spin" /> : <CheckCircle2 size={21} />}
              {finalizando ? "FINALIZANDO..." : "FINALIZAR VENDA (F2)"}
            </button>
          </div>
        </section>
      </div>

      <section className="mt-5 max-w-[1500px] rounded-[28px] bg-[#102356] p-5 text-white shadow-xl sm:p-7">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <ReceiptText className="text-blue-300" size={24} />
            <div>
              <h2 className="text-xl font-bold">Saídas recentes</h2>
              <p className="mt-1 text-xs text-white/45">Últimas vendas salvas em pedidos e itens_pedido.</p>
            </div>
          </div>
          <span className="text-xs text-white/40">Exibindo até 10 registros</span>
        </div>

        {historico.pedidos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-white/45">
            Nenhuma saída registrada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#0b183b] text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-4 py-3">Venda</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Itens</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3 text-right">Desconto</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {historico.pedidos.map((pedido) => (
                  <tr key={pedido.id} className="border-t border-white/5 bg-[#0f1d43] transition hover:bg-[#142650]">
                    <td className="px-4 py-4 font-mono text-xs font-bold text-blue-300">#{shortOrderId(pedido.id)}</td>
                    <td className="px-4 py-4 text-white/70">{formatDate(pedido.data_venda)}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white/85">{pedido.quantidade_itens} un.</p>
                      <p className="mt-1 max-w-[260px] truncate text-xs text-white/40">
                        {pedido.itens.map((item) => `${item.produto} (${item.tamanho ?? "-"})`).join(", ")}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      {CANAIS.find((canal) => canal.value === pedido.canal_venda)?.label ?? pedido.canal_venda}
                    </td>
                    <td className="px-4 py-4 text-white/70">{pedido.forma_pagamento ?? "—"}</td>
                    <td className="px-4 py-4 text-right text-red-300">{formatCurrency(pedido.desconto)}</td>
                    <td className="px-4 py-4 text-right font-bold text-emerald-300">{formatCurrency(pedido.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
