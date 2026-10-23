import type { FaixaMercadoResposta } from "@/src/lib/mercado";

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FaixaMercado({
  faixa,
  carregando,
  preco,
}: {
  faixa: FaixaMercadoResposta | null;
  carregando: boolean;
  preco: string;
}) {
  const valor = preco.trim() === "" ? null : Number(preco);
  const posicao = faixa?.disponivel && valor !== null && Number.isFinite(valor)
    ? valor < faixa.preco.p25
      ? "Seu preço está abaixo da faixa."
      : valor > faixa.preco.p75
        ? "Seu preço está acima da faixa."
        : "Seu preço está dentro da faixa."
    : null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      aria-busy={carregando}
      className="mt-3 min-h-36 text-[12.5px] leading-relaxed text-[#64748b]"
    >
      {carregando ? (
        <div aria-hidden="true" className="space-y-2 pt-1">
          <div className="mm-skeleton h-3 w-full rounded" />
          <div className="mm-skeleton h-3 w-5/6 rounded" />
          <div className="mm-skeleton h-3 w-2/3 rounded" />
        </div>
      ) : faixa?.disponivel ? (
        <div className="mm-fade">
          <p>
            Lojas semelhantes vendem entre {money(faixa.preco.p25)} e{" "}
            {money(faixa.preco.p75)} (mediana {money(faixa.preco.mediana)}), com
            base em {faixa.n_lojas} lojas
            {faixa.filtros_aplicados.includes("faixa_faturamento")
              ? " de porte parecido com a sua"
              : ""}.
          </p>
          {posicao && <p className="mt-2">{posicao}</p>}
        </div>
      ) : faixa?.motivo === "amostra_insuficiente" ? (
        <p className="mm-fade">
          Ainda não há lojas semelhantes suficientes para comparar.
        </p>
      ) : null}
    </div>
  );
}
