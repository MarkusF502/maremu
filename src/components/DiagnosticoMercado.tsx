import ComposicaoPreco from "@/src/components/ComposicaoPreco";
import {
  diagnosticarPrecoMercado,
  type ComposicaoPreco as Composicao,
  type FaixaMercadoDisponivel,
} from "@/src/lib/mercado";

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DiagnosticoMercado({
  faixa,
  composicao,
  cenarios,
}: {
  faixa: FaixaMercadoDisponivel | null;
  composicao: Composicao | null;
  cenarios: readonly { tipo: string; preco_sugerido: number }[];
}) {
  const diagnostico = faixa && composicao
    ? diagnosticarPrecoMercado(faixa.preco, composicao.preco_piso, cenarios)
    : "sem_diagnostico";
  const ideal = cenarios.find(({ tipo }) => tipo === "ideal");
  const mensagem = faixa && composicao && (
    diagnostico === "piso_acima_da_faixa"
      ? `Mesmo o preço mínimo que cobre seus custos (${money(composicao.preco_piso)}) fica acima do que lojas parecidas cobram (até ${money(faixa.preco.p75)}). Vale rever o custo com o fornecedor, o custo fixo da loja ou se este produto compensa.`
      : diagnostico === "ideal_acima_da_faixa"
        ? `Seu preço ideal fica acima do que lojas parecidas cobram. Preços a partir de ${money(composicao.preco_piso)} ainda cobrem seus custos.`
        : diagnostico === "tudo_abaixo_da_faixa"
          ? "Lojas parecidas cobram mais por este produto. Seus custos permitem uma margem maior, se fizer sentido para a sua loja."
          : null
  );
  const mostrarComposicao = diagnostico === "piso_acima_da_faixa" || diagnostico === "ideal_acima_da_faixa";

  return (
    <div className={mensagem
      ? `mb-4 rounded-xl border p-3.5 text-[12.5px] leading-relaxed ${diagnostico === "piso_acima_da_faixa"
          ? "border-[#c9d7ee] bg-[#eef4ff] text-[#1a3673]"
          : "border-slate-200 bg-slate-50 text-slate-600"}`
      : undefined}
    >
      {/* Só a mensagem participa da região viva; digitação e expansão não a alteram. */}
      <div aria-live="polite" aria-atomic="true">
        {mensagem && <p className={diagnostico === "piso_acima_da_faixa" ? "font-semibold" : undefined}>{mensagem}</p>}
      </div>
      {mostrarComposicao && composicao && ideal && (
        <ComposicaoPreco
          key={diagnostico}
          composicao={composicao}
          precoIdeal={ideal.preco_sugerido}
          abertaInicialmente={diagnostico === "piso_acima_da_faixa"}
        />
      )}
    </div>
  );
}
