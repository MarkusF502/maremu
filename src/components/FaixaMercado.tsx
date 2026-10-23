import {
  descricaoFaixaMercado,
  posicaoPrecoMercado,
  type FaixaMercadoResposta,
} from "@/src/lib/mercado";
import PosicaoMercado from "@/src/components/PosicaoMercado";

export default function FaixaMercado({
  faixa,
  carregando,
  preco,
}: {
  faixa: FaixaMercadoResposta | null;
  carregando: boolean;
  preco: string;
}) {
  const posicao = faixa?.disponivel
    ? posicaoPrecoMercado(preco, faixa)
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
          <p>{descricaoFaixaMercado(faixa)}</p>
          {posicao && <div className="mt-2"><PosicaoMercado posicao={posicao} /></div>}
        </div>
      ) : faixa?.motivo === "amostra_insuficiente" ? (
        <p className="mm-fade">
          Ainda não há lojas semelhantes suficientes para comparar.
        </p>
      ) : null}
    </div>
  );
}
