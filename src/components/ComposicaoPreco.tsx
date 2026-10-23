"use client";

import { useId, useState } from "react";
import type { ComposicaoPreco as Composicao } from "@/src/lib/mercado";

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ComposicaoPreco({
  composicao,
  precoIdeal,
  abertaInicialmente,
}: {
  composicao: Composicao;
  precoIdeal: number;
  abertaInicialmente: boolean;
}) {
  const [aberta, setAberta] = useState(abertaInicialmente);
  const id = useId();
  const impostos = precoIdeal * composicao.percentual_variavel;
  const lucro = precoIdeal - composicao.custo_base - composicao.custo_fixo_unitario - impostos;
  const partes = [
    { nome: "Custo da peça + frete", valor: composicao.custo_base },
    { nome: "Custo fixo da loja por peça", valor: composicao.custo_fixo_unitario },
    { nome: "Impostos e taxas", valor: impostos },
    { nome: lucro < 0 ? "Prejuízo" : "Lucro", valor: lucro },
  ];

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={aberta}
        aria-controls={id}
        onClick={() => setAberta((atual) => !atual)}
        className="mm-hover rounded text-left text-[12px] font-bold text-[#1a3673] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0080ff]"
      >
        {aberta ? "Recolher composição do preço" : "Ver de onde vem o preço"}
      </button>
      <div id={id} hidden={!aberta}>
        <p className="mt-3 text-[12px] font-semibold text-slate-700">
          Venda ideal: {money(precoIdeal)}
        </p>
        <dl className="mt-2 divide-y divide-slate-200 text-[12px]">
          {partes.map(({ nome, valor }) => (
            <div key={nome} className="flex items-start justify-between gap-3 py-2">
              <dt className="min-w-0 text-slate-600">{nome}</dt>
              <dd className="shrink-0 text-right tabular-nums text-slate-700">
                <span className="block font-semibold">{money(valor)}</span>
                <span className="block text-[11px] text-slate-500">
                  {precoIdeal !== 0
                    ? (valor / precoIdeal).toLocaleString("pt-BR", {
                        style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1,
                      })
                    : "—"}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        {precoIdeal === 0 && (
          <p className="text-[11px] text-slate-500">Percentuais indisponíveis para preço zero.</p>
        )}
      </div>
    </div>
  );
}
