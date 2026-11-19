"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import {
  fetchFaixaMercado,
  type ComposicaoPreco,
  type FaixaMercadoDisponivel,
} from "@/src/lib/mercado";
import { recomendacaoValida, type RecomendacaoDisponivel, type TipoCenario } from "@/src/lib/recomendacao";
import PricingModal, { type CenarioIA } from "./PricingModal";

export type PrecoConfirmado = {
  preco_final: number;
  cenario_escolhido: CenarioIA["id"] | "manual";
  /** Tipo do cenário escolhido nesta rodada; null quando o preço foi manual. */
  tipo_escolhido: TipoCenario | null;
};

type RespostaSugerir = {
  log_id: string;
  cenarios: CenarioIA[];
  composicao?: ComposicaoPreco | null;
  recomendacao?: unknown;
};

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Reprecificação de um produto que já existe: pede os cenários em
 * POST /precificacao/sugerir, abre o mesmo PricingModal do cadastro e
 * confirma pelo fluxo já existente (POST /precificacao/confirmar).
 * Nenhum preço é aplicado sem o lojista salvar.
 */
export default function ReprecificarProduto({
  produtoId,
  categoriaId,
  precoAtual,
  precoPiso,
  onConfirmado,
  close,
}: {
  produtoId: string;
  categoriaId: string | null;
  precoAtual: string | null;
  precoPiso: string | null;
  onConfirmado: (resultado: PrecoConfirmado) => void;
  close: () => void;
}) {
  const [cenarios, setCenarios] = useState<CenarioIA[]>([]);
  const [composicao, setComposicao] = useState<ComposicaoPreco | null>(null);
  const [recomendacao, setRecomendacao] = useState<RecomendacaoDisponivel | null>(null);
  const [faixa, setFaixa] = useState<FaixaMercadoDisponivel | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [cenarioEscolhido, setCenarioEscolhido] = useState<string>("manual");
  const [preco, setPreco] = useState(precoAtual ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sugerir = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    setComposicao(null);
    setRecomendacao(null);
    try {
      const response = await apiFetch(`/api/precificacao/sugerir/${produtoId}`, { method: "POST", signal });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Não foi possível gerar sugestões de preço agora.");
      }
      const data: RespostaSugerir = await response.json();
      setLogId(data.log_id);
      setCenarios(data.cenarios);
      setComposicao(data.composicao ?? null);
      // Indisponível, ausente ou inválida: o modal fica como sempre foi.
      setRecomendacao(recomendacaoValida(data.recomendacao));
    } catch (err) {
      if (signal?.aborted) return;
      setLogId(null);
      setCenarios([]);
      setError(err instanceof Error ? err.message : "Erro ao buscar sugestões de preço.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [produtoId]);

  useEffect(() => {
    const controller = new AbortController();
    // Busca assíncrona ao abrir o modal; o estado só muda quando a resposta chega.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void sugerir(controller.signal);
    return () => controller.abort();
  }, [sugerir]);

  useEffect(() => {
    if (!categoriaId) return;
    const controller = new AbortController();
    fetchFaixaMercado(categoriaId, controller.signal)
      .then((resposta) => setFaixa(resposta.disponivel ? resposta : null))
      // A faixa é opcional: sem ela o modal só não mostra a comparação.
      .catch(() => setFaixa(null));
    return () => controller.abort();
  }, [categoriaId]);

  async function salvar() {
    if (!preco.trim()) {
      setError("Informe um preço de venda.");
      return;
    }
    if (!logId) {
      setError("Não foi possível validar a sugestão. Recalcule e tente novamente.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const response = await apiFetch("/api/precificacao/confirmar", {
        method: "POST",
        body: JSON.stringify({ log_id: logId, cenario_escolhido: cenarioEscolhido, preco_final: Number(preco) }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Não foi possível salvar o preço.");
      }

      const escolhido = cenarios.find(({ id }) => id === cenarioEscolhido);
      onConfirmado({
        preco_final: Number(preco),
        cenario_escolhido: escolhido ? escolhido.id : "manual",
        tipo_escolhido: escolhido ? escolhido.tipo : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o preço.");
    } finally {
      setSaving(false);
    }
  }

  const piso = composicao?.preco_piso ?? (precoPiso ? Number(precoPiso) : null);

  return (
    <PricingModal
      composicao={composicao}
      faixaMercado={faixa}
      precoPiso={piso !== null && Number.isFinite(piso) ? formatBRL(piso) : "—"}
      cenarios={cenarios}
      cenarioEscolhido={cenarioEscolhido}
      recomendacao={recomendacao}
      loading={loading}
      preco={preco}
      error={error}
      saving={saving}
      onPickCenario={(cenario) => {
        setCenarioEscolhido(cenario.id);
        setPreco(String(cenario.preco_sugerido));
        setError("");
      }}
      onPrecoChange={(valor) => {
        setCenarioEscolhido("manual");
        setPreco(valor);
      }}
      onRecarregar={() => {
        setCenarioEscolhido("manual");
        void sugerir();
      }}
      onSalvar={salvar}
      close={close}
    />
  );
}
