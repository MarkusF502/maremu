import type { PosicaoPrecoMercado } from "@/src/lib/mercado";

export default function PosicaoMercado({ posicao }: { posicao: PosicaoPrecoMercado }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-slate-600">
      Preço {posicao}.
    </span>
  );
}
