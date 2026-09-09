"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  Receipt,
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

function formatHora(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(value));
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
      <div className="flex h-full items-center justify-center text-[#64748b]">
        <Loader2 className="mr-3 animate-spin" size={26} />
        Carregando produtos e saídas…
      </div>
    );
  }

  return (
    <div className="max-w-360 px-8.5 pb-13 pt-7.5 mm-screen-in">

      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.09em] text-[#0080ff]">Ponto de venda</p>
          <h1 className="mt-1.5 text-[29px] font-extrabold tracking-tight text-[#0f172a]">Fluxo de saídas</h1>
          <p className="mt-1.5 text-sm text-[#64748b]">Venda registrada no banco e baixa automática do estoque.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="rounded-[13px] border border-[#e4eaf4] bg-white px-4 py-2.75">
            <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[#8494ad]">Vendas hoje</p>
            <p className="mt-1.25 text-[19px] font-extrabold text-[#1a3673]" style={{ fontVariantNumeric: 'tabular-nums' }}>{historico.resumo_hoje.quantidade_vendas}</p>
          </div>
          <div className="rounded-[13px] border border-[#e4eaf4] bg-white px-4 py-2.75">
            <p className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[#8494ad]">Faturamento hoje</p>
            <p className="mt-1.25 whitespace-nowrap text-[19px] font-extrabold text-[#1a3673]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(historico.resumo_hoje.faturamento)}</p>
          </div>
          <button
            type="button"
            onClick={() => void carregarDados(true)}
            disabled={atualizando}
            aria-label="Atualizar"
            className="mm-hover flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#e4eaf4] bg-white text-[#64748b] hover:border-[#0080ff] hover:text-[#0080ff] disabled:opacity-60"
          >
            <RefreshCw size={18} className={atualizando ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {(erro || sucesso) && (
        <div
          className={`mb-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
            erro ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {erro ? <AlertCircle size={19} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={19} className="mt-0.5 shrink-0" />}
          <span>{erro ?? sucesso}</span>
        </div>
      )}

      <div className="grid items-start gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(258px,0.62fr) minmax(320px,0.78fr)' }}>

        {/* Adicionar produto */}
        <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-5.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-[#0f172a]">Adicionar produto</h2>
              <p className="mt-1 text-[12.5px] text-[#64748b]">Selecione um item real do estoque cadastrado.</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#eef4ff] px-2.75 py-1.25 text-[11.5px] font-bold text-[#1a3673]">
              {produtos.length} produtos
            </span>
          </div>

          <div className="mm-hover mt-4 flex h-11 items-center gap-2.25 rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.5 text-[#94a3b8] focus-within:border-[#0080ff]">
            <Search size={16} strokeWidth={1.6} className="shrink-0" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, SKU ou categoria"
              className="w-full flex-1 border-none bg-transparent text-sm font-medium text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
            />
          </div>

          <div className="mt-3.5 flex max-h-67 flex-col gap-2 overflow-y-auto pr-1">
            {produtosFiltrados.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e4eaf4] bg-[#f8fafd] p-6 text-center text-sm text-[#94a3b8]">
                Nenhum produto encontrado.
              </div>
            ) : produtosFiltrados.map((produto) => {
              const ativo = produto.id === produtoSelecionadoId;
              return (
                <button
                  key={produto.id}
                  type="button"
                  onClick={() => setProdutoSelecionadoId(produto.id)}
                  className={`mm-hover flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left ${
                    ativo ? "border-[#0080ff] bg-[#f5faff]" : "border-[#eef2f8] bg-white hover:border-[#dbe6f7] hover:bg-[#f8fbff]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-[#0f172a]">{produto.nome}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-[#94a3b8]">
                      {produto.categoria}{produto.sku ? ` • SKU ${produto.sku}` : ""}
                    </p>
                  </div>
                  <div className="ml-auto shrink-0 text-right">
                    <p className="text-[13.5px] font-bold text-[#1a3673]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(produto.preco_venda_atual)}</p>
                    <p className={`mt-0.5 text-[11.5px] font-semibold ${produto.estoque_total > 0 ? "text-[#047857]" : "text-red-600"}`}>
                      {produto.estoque_total} un.
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <h3 className="mb-2.75 mt-5 text-[12.5px] font-bold uppercase tracking-wider text-[#8494ad]">Variação selecionada</h3>
          <div className="flex min-h-18 flex-wrap gap-2.5">
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
                  className={`mm-hover relative min-w-28 rounded-xl border px-3.5 py-2.75 text-left ${
                    ativo ? "border-[#0080ff] bg-[#f5faff]" : "border-[#eef2f8] bg-white hover:border-[#dbe6f7]"
                  } ${esgotada ? "opacity-55" : ""}`}
                >
                  <p className="text-[13px] font-bold text-[#0f172a]">Tam. {variante.tamanho}</p>
                  <p className={`mt-0.75 text-[11.5px] font-semibold ${esgotada ? "text-red-600" : "text-[#047857]"}`}>
                    {esgotada ? "Sem saldo" : `${disponivel} disponível(is)`}
                  </p>
                  {quantidadeCarrinho > 0 && (
                    <span className="mm-pop-in absolute -right-2 -top-2 flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-[#0080ff] px-1.5 text-[11px] font-extrabold text-white">
                      {quantidadeCarrinho}
                    </span>
                  )}
                </button>
              );
            })}
            {produtoSelecionado && produtoSelecionado.variantes.length === 0 && (
              <p className="text-sm text-[#94a3b8]">Este produto não possui variações cadastradas.</p>
            )}
          </div>
        </div>

        {/* Preview do produto selecionado */}
        <div className="mm-rise-in rounded-2xl border border-[#e4eaf4] bg-white p-5.5">
          <div className="flex h-33 items-center justify-center rounded-[13px] border border-dashed border-[#dbe6f7] bg-[#f5f8fe] text-[#b7c8e0]">
            <Package size={44} strokeWidth={1.2} />
          </div>

          {produtoSelecionado ? (
            <>
              <span className="mt-4 inline-block rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1a3673]">
                {produtoSelecionado.categoria}
              </span>
              <h3 className="mt-2.75 text-[16px] font-bold leading-tight text-[#0f172a]">{produtoSelecionado.nome}</h3>
              <p className="mt-2.25 text-2xl font-extrabold tracking-tight text-[#0080ff]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(produtoSelecionado.preco_venda_atual)}
              </p>
              <p className="mt-3.5 rounded-[11px] bg-[#f8fafd] px-3.25 py-2.75 text-[12.5px] text-[#475569]">
                {varianteSelecionada
                  ? `Tamanho ${varianteSelecionada.tamanho} • ${varianteSelecionada.quantidade_estoque} em estoque`
                  : "Selecione uma variação"}
              </p>
              <button
                type="button"
                onClick={adicionarAoCarrinho}
                disabled={!varianteSelecionada || varianteSelecionada.quantidade_estoque <= quantidadeNoCarrinho(varianteSelecionada.id)}
                className="mm-hover mt-4.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1a3673] text-[14.5px] font-bold text-white hover:-translate-y-px hover:bg-[#0080ff] active:translate-y-0 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Plus size={17} strokeWidth={2} />
                Adicionar ao carrinho
              </button>
            </>
          ) : (
            <p className="mt-6 text-center text-sm text-[#94a3b8]">Selecione um produto para visualizar suas variações.</p>
          )}
        </div>

        {/* Carrinho */}
        <div className="mm-rise-in sticky rounded-2xl border border-[#e4eaf4] bg-white p-5.5" style={{ top: 82 }}>
          <div className="flex items-center justify-between border-b border-[#eef2f8] pb-3.5">
            <h2 className="flex items-center gap-2.25 text-[16px] font-bold text-[#0f172a]">
              <ShoppingCart size={18} strokeWidth={1.6} className="text-[#1a3673]" />
              Carrinho
            </h2>
            <span className="rounded-full bg-[#eef4ff] px-2.75 py-1.25 text-[11.5px] font-bold text-[#1a3673]">
              {quantidadeItens}
            </span>
          </div>

          {carrinho.length === 0 ? (
            <div className="mt-3.5 flex h-39.5 flex-col items-center justify-center gap-2.5 rounded-[13px] border border-dashed border-[#dbe4f2] text-[#a9b6ca]">
              <ShoppingCart size={30} strokeWidth={1.3} />
              <p className="text-[13px]">O carrinho está vazio.</p>
            </div>
          ) : (
            <div className="mt-3.5 flex max-h-61.5 flex-col gap-2.25 overflow-y-auto pr-1">
              {carrinho.map((item) => (
                <div key={item.variante_id} className="mm-pop-in rounded-xl border border-[#eef2f8] bg-[#f8fafd] p-3.25">
                  <div className="flex items-start gap-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#0f172a]">{item.nome}</p>
                      <p className="mt-0.75 text-[11.5px] text-[#94a3b8]">{item.tamanho}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerItem(item.variante_id)}
                      aria-label={`Remover ${item.nome}`}
                      className="mm-hover ml-auto flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md text-[#a5b2c6] hover:bg-[#fef2f2] hover:text-red-600"
                    >
                      <Trash2 size={14} strokeWidth={1.7} />
                    </button>
                  </div>
                  <div className="mt-2.75 flex items-center justify-between gap-2.5">
                    <div className="flex items-center rounded-[10px] border border-[#e4eaf4] bg-white">
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.variante_id, -1)}
                        aria-label="Diminuir quantidade"
                        className="mm-hover flex h-7.5 w-7.5 items-center justify-center rounded-[9px] text-[#475569] hover:bg-[#f1f5fb]"
                      >
                        <Minus size={14} strokeWidth={2} />
                      </button>
                      <span className="min-w-6.5 text-center text-[13px] font-extrabold text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.quantidade}</span>
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.variante_id, 1)}
                        disabled={item.quantidade >= item.estoque_disponivel}
                        aria-label="Aumentar quantidade"
                        className="mm-hover flex h-7.5 w-7.5 items-center justify-center rounded-[9px] text-[#475569] hover:bg-[#f1f5fb] disabled:opacity-30"
                      >
                        <Plus size={14} strokeWidth={2} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#94a3b8]">{formatCurrency(item.preco)}</p>
                      <p className="mt-0.5 text-[13.5px] font-extrabold text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.preco * item.quantidade)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-[#eef2f8] pt-4">
            <label className="text-[11.5px] font-bold text-[#8494ad]">
              Canal da venda
              <select
                value={canalVenda}
                onChange={(event) => setCanalVenda(event.target.value)}
                className="mt-1.75 h-10 w-full cursor-pointer rounded-[10px] border border-[#e0e7f3] bg-[#fbfcfe] px-2.5 text-[13px] font-semibold text-[#0f172a] outline-none"
              >
                {CANAIS.map((canal) => <option key={canal.value} value={canal.value}>{canal.label}</option>)}
              </select>
            </label>
            <label className="text-[11.5px] font-bold text-[#8494ad]">
              Pagamento
              <select
                value={formaPagamento}
                onChange={(event) => setFormaPagamento(event.target.value)}
                className="mt-1.75 h-10 w-full cursor-pointer rounded-[10px] border border-[#e0e7f3] bg-[#fbfcfe] px-2.5 text-[13px] font-semibold text-[#0f172a] outline-none"
              >
                {FORMAS_PAGAMENTO.map((forma) => <option key={forma} value={forma}>{forma}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-3 block text-[11.5px] font-bold text-[#8494ad]">
            Desconto total
            <div className="mm-hover mt-1.75 flex h-10 items-center gap-1.75 rounded-[10px] border border-[#e0e7f3] bg-[#fbfcfe] px-3 focus-within:border-[#0080ff]">
              <span className="text-[12.5px] font-bold text-[#94a3b8]">R$</span>
              <CurrencyInput
                max={subtotal}
                value={desconto}
                onChange={setDesconto}
                className="w-full flex-1 border-none bg-transparent text-sm font-bold text-[#0f172a] outline-none"
              />
            </div>
          </label>

          <div className="mt-4 flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between text-[#64748b]">
              <span>Subtotal</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Desconto</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>- {formatCurrency(descontoAplicado)}</span>
            </div>
            <div className="flex items-end justify-between border-t border-[#eef2f8] pt-2.75">
              <span className="text-xs font-extrabold tracking-wider text-[#334155]">TOTAL</span>
              <span className="text-[26px] font-extrabold tracking-tight text-[#0f172a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void finalizarVenda()}
            disabled={carrinho.length === 0 || finalizando}
            className="mm-hover mt-4 flex h-13 w-full items-center justify-center gap-2.25 rounded-xl bg-[#1a3673] text-[14.5px] font-extrabold tracking-[.03em] text-white hover:-translate-y-px hover:bg-[#0080ff] active:translate-y-0 active:scale-[.985] disabled:cursor-not-allowed disabled:bg-[#cbd5e1] disabled:hover:translate-y-0"
          >
            {finalizando ? <Loader2 size={19} className="animate-spin" /> : <CheckCircle2 size={19} />}
            {finalizando ? "FINALIZANDO…" : "FINALIZAR VENDA (F2)"}
          </button>
        </div>
      </div>

      <div className="mm-rise-in mt-4 overflow-hidden rounded-2xl border border-[#e4eaf4] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6.5 py-5 pb-3.5">
          <div className="flex items-center gap-2.75">
            <Receipt size={20} strokeWidth={1.6} className="text-[#0080ff]" />
            <div>
              <h2 className="text-[16px] font-bold text-[#0f172a]">Saídas recentes</h2>
              <p className="mt-0.75 text-[12.5px] text-[#64748b]">Últimas vendas salvas em pedidos e itens_pedido.</p>
            </div>
          </div>
          <span className="text-xs text-[#94a3b8]">Exibindo até 10 registros</span>
        </div>

        {historico.pedidos.length === 0 ? (
          <div className="px-6.5 pb-6.5">
            <div className="rounded-xl border border-dashed border-[#e4eaf4] bg-[#f8fafd] py-10 text-center text-sm text-[#8494ad]">
              Nenhuma saída registrada até o momento.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-215">
              <div
                className="grid gap-3 border-y border-[#eef2f8] bg-[#fafbfe] px-6.5 py-2.75 text-[11px] font-bold uppercase tracking-wider text-[#8494ad]"
                style={{ gridTemplateColumns: '98px 74px minmax(0,1.7fr) 1.05fr 1.15fr 0.8fr 0.85fr' }}
              >
                <span>Venda</span><span>Hora</span><span>Itens</span><span>Canal</span><span>Pagamento</span>
                <span className="text-right">Desconto</span><span className="text-right">Total</span>
              </div>
              {historico.pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="mm-hover grid items-center gap-3 border-b border-[#f4f7fb] px-6.5 py-3.25 text-[13px] text-[#475569] last:border-b-0 hover:bg-[#f8fbff]"
                  style={{ gridTemplateColumns: '98px 74px minmax(0,1.7fr) 1.05fr 1.15fr 0.8fr 0.85fr' }}
                >
                  <span className="font-mono text-[11.5px] font-bold text-[#0080ff]">#{shortOrderId(pedido.id)}</span>
                  <span>{formatHora(pedido.data_venda)}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#0f172a]">{pedido.quantidade_itens} un.</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-[#94a3b8]">
                      {pedido.itens.map((item) => `${item.produto} (${item.tamanho ?? "-"})`).join(", ")}
                    </p>
                  </div>
                  <span className="truncate">{CANAIS.find((canal) => canal.value === pedido.canal_venda)?.label ?? pedido.canal_venda}</span>
                  <span className="truncate">{pedido.forma_pagamento ?? "—"}</span>
                  <span className="text-right text-red-600" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(pedido.desconto)}</span>
                  <span className="text-right font-bold text-[#047857]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(pedido.valor_total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
