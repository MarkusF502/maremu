"use client";

import { CategoriaPai, subUnica } from "@/src/lib/taxonomia";

const selectClass =
  "mt-2 h-11 w-full cursor-pointer rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff]";

/**
 * Selects encadeados da taxonomia: categoria-pai e sub-categoria.
 * Quando o pai tem uma sub-categoria só, ela é escolhida junto com o pai e o
 * segundo select não aparece.
 */
export default function TaxonomiaSelects({
  arvore,
  paiId,
  subCategoriaId,
  onChange,
  disabled = false,
  className = "flex flex-col gap-3.5",
}: {
  arvore: CategoriaPai[];
  paiId: number | "";
  subCategoriaId: number | "";
  onChange: (paiId: number | "", subCategoriaId: number | "") => void;
  disabled?: boolean;
  className?: string;
}) {
  const pai = arvore.find((item) => item.id === paiId);
  const unica = subUnica(pai);

  function selecionarPai(valor: string) {
    if (!valor) {
      onChange("", "");
      return;
    }
    const novoPai = arvore.find((item) => item.id === Number(valor));
    if (!novoPai) return;
    const sub = subUnica(novoPai);
    onChange(novoPai.id, sub ? sub.id : "");
  }

  return (
    <div className={className}>
      <label className="block min-w-0 flex-1 text-[12.5px] font-bold text-[#475569]">
        Categoria principal
        <select
          value={paiId}
          disabled={disabled}
          onChange={(event) => selecionarPai(event.target.value)}
          className={selectClass}
        >
          <option value="">Selecione</option>
          {arvore.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
      </label>

      {pai && !unica && (
        <label className="mm-rise-in block min-w-0 flex-1 text-[12.5px] font-bold text-[#475569]">
          Sub-categoria
          <select
            value={subCategoriaId}
            disabled={disabled}
            onChange={(event) =>
              onChange(pai.id, event.target.value ? Number(event.target.value) : "")
            }
            className={selectClass}
          >
            <option value="">Selecione</option>
            {pai.sub_categorias.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.nome}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
