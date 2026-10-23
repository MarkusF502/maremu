"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import {
  CategoriaLoja,
  CategoriaPai,
  mensagemDeErro,
  nomeDaClassificacao,
} from "@/src/lib/taxonomia";
import TaxonomiaSelects from "./TaxonomiaSelects";

/**
 * Modal de nova categoria, usado no cadastro de produto e na página de
 * categorias. O nome na loja é opcional: em branco, herda o da classificação.
 */
export default function NovaCategoriaModal({
  arvore,
  onCriada,
  close,
}: {
  arvore: CategoriaPai[];
  onCriada: (categoria: CategoriaLoja) => void;
  close: () => void;
}) {
  const [nome, setNome] = useState("");
  const [paiId, setPaiId] = useState<number | "">("");
  const [subId, setSubId] = useState<number | "">("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const pai = arvore.find((item) => item.id === paiId);
  const sub = pai?.sub_categorias.find((item) => item.id === subId);
  const nomeSugerido = pai && sub ? nomeDaClassificacao(pai, sub) : "";

  async function salvar() {
    if (!pai || !sub) return;

    setError("");
    setSaving(true);
    try {
      const response = await apiFetch("/api/categorias", {
        method: "POST",
        body: JSON.stringify({
          nome: nome.trim() || nomeDaClassificacao(pai, sub),
          sub_categoria_id: sub.id,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(mensagemDeErro(body, "Não foi possível criar a categoria."));
        return;
      }
      const { categoria }: { categoria: CategoriaLoja } = await response.json();
      onCriada(categoria);
    } catch {
      setError("Não foi possível criar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar"
        onClick={close}
        className="mm-fade absolute inset-0 bg-[rgba(15,23,42,.4)]"
      />
      <div className="mm-pop-in-centered absolute left-1/2 top-1/2 w-[calc(100%-32px)] max-w-100 -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-white p-6.5 shadow-[0_40px_80px_-30px_rgba(15,23,42,.5)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#0f172a]">Nova categoria</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="mm-hover flex h-8 w-8 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#f1f5fb]"
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        </div>
        <p className="mb-4.5 text-[12.5px] leading-relaxed text-[#64748b]">
          A classificação é o que permite comparar seus preços com lojas
          semelhantes.
        </p>

        <TaxonomiaSelects
          arvore={arvore}
          paiId={paiId}
          subCategoriaId={subId}
          disabled={saving}
          onChange={(novoPai, novaSub) => {
            setPaiId(novoPai);
            setSubId(novaSub);
            setError("");
          }}
        />

        <label className="mt-3.5 block text-[12.5px] font-bold text-[#475569]">
          Nome na sua loja (opcional)
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={nomeSugerido || "Ex: Camisetas"}
            className="mt-2 h-11 w-full rounded-[11px] border border-[#e0e7f3] bg-[#fbfcfe] px-3.5 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#0080ff] focus:shadow-[0_0_0_3px_rgba(0,128,255,.14)]"
          />
        </label>
        {nomeSugerido && (
          <p className="mt-2 text-[11.5px] text-[#8494ad]">
            Em branco, a categoria fica com o nome “{nomeSugerido}”.
          </p>
        )}

        {error && (
          <p className="mm-rise-in mt-4 rounded-[11px] border border-red-200 bg-red-50 px-3.5 py-2.75 text-[12.5px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={!subId || saving}
          className="mm-hover mt-5 w-full rounded-xl bg-[#1a3673] py-3 text-center text-sm font-bold text-white hover:bg-[#0080ff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar categoria"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
