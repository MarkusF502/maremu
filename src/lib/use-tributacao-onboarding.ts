"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { DadosSimulacaoMargem } from "./margem-liquida";

/** Reaproveita as premissas tributárias da API; não estima taxas no frontend. */
export function useTributacaoOnboarding(regime: string | undefined, canais: string[], posicionamento: string) {
  const chave = JSON.stringify({ regime, canais, posicionamento });
  const [resultado, setResultado] = useState<{ chave: string; dados: DadosSimulacaoMargem } | null>(null);
  useEffect(() => {
    if (!regime || canais.length === 0) return;
    let ativo = true;
    const controller = new AbortController();
    apiFetch("/api/loja/onboarding/inferir", {
      method: "POST", signal: controller.signal,
      body: JSON.stringify({ nome: "Simulação de lucro limpo", faixa_faturamento: "ate_10k", regime, canais, posicionamento }),
    }).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      const taxas: number[] = data.canais?.map((canal: { taxa_percentual: number }) => Number(canal.taxa_percentual)) ?? [];
      if (ativo && Number.isFinite(data.loja?.aliquota_efetiva) && taxas.length && taxas.every(Number.isFinite)) {
        setResultado({ chave, dados: { aliquota_efetiva: data.loja.aliquota_efetiva, taxa_canal: Math.max(...taxas) } });
      }
    }).catch(() => { /* A ausência de simulação não impede o preenchimento. */ });
    return () => { ativo = false; controller.abort(); };
    // A chave contém todos os dados primitivos do pedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  return resultado?.chave === chave ? resultado.dados : {};
}
