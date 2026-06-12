"use client"

import React, { useState } from "react"
import { Plus, ChevronDown, X, Upload } from "lucide-react"

type Category = { id: string; name: string; description?: string }
type GradeItem = {
  id: string
  tamanho: string
  cor: string
  quantidade: number
  custoEspecifico?: number | null
  precoEspecifico?: number | null
}

export default function Page() {
  const [nome, setNome] = useState("")
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [custoBase, setCustoBase] = useState<string>("")
  const [precoVendaBase, setPrecoVendaBase] = useState<string>("")
  const [grades, setGrades] = useState<GradeItem[]>([])

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")

  const [gradeTamanho, setGradeTamanho] = useState("")
  const [gradeCor, setGradeCor] = useState("")
  const [gradeQuantidade, setGradeQuantidade] = useState<number | "">("")
  const [gradeCusto, setGradeCusto] = useState<number | "">("")
  const [gradePreco, setGradePreco] = useState<number | "">("")

  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Camisetas" },
    { id: "2", name: "Calças" },
    { id: "3", name: "Acessórios" },
  ])

  function handleSelectCategory(catId: string) {
    setCategoriaId(catId)
    setIsCategoryDropdownOpen(false)
  }

  function handleOpenCreateCategory() {
    setIsCategoryDropdownOpen(false)
    setIsCategoryModalOpen(true)
  }

  function handleSaveCategory() {
    if (!newCategoryName.trim()) return
    const newCat: Category = {
      id: String(Date.now()),
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim() || undefined,
    }
    setCategories((s) => [...s, newCat])
    setCategoriaId(newCat.id)
    setNewCategoryName("")
    setNewCategoryDescription("")
    setIsCategoryModalOpen(false)
  }

  function handleAddGrade() {
    const item: GradeItem = {
      id: String(Date.now()),
      tamanho: gradeTamanho,
      cor: gradeCor,
      quantidade: Number(gradeQuantidade) || 0,
      custoEspecifico: gradeCusto === "" ? null : Number(gradeCusto),
      precoEspecifico: gradePreco === "" ? null : Number(gradePreco),
    }
    setGrades((s) => [...s, item])
    setGradeTamanho("")
    setGradeCor("")
    setGradeQuantidade("")
    setGradeCusto("")
    setGradePreco("")
    setIsGradeModalOpen(false)
  }

  function handleRemoveGrade(id: string) {
    setGrades((s) => s.filter((g) => g.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      nome,
      categoriaId,
      custoBase: custoBase ? Number(custoBase) : null,
      precoVendaBase: precoVendaBase ? Number(precoVendaBase) : null,
      grades,
    }
    console.log("Cadastrar Produto:", payload)
    setNome("")
    setCategoriaId(null)
    setCustoBase("")
    setPrecoVendaBase("")
    setGrades([])
  }

  return (
    <div className="min-h-screen p-8 bg-[#bfdbfe]">
      {/* Título Principal Fora do Card */}
      <h1 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight">Novo Produto</h1>

      <form onSubmit={handleSubmit} className="max-w-[1200px]">
        {/* Container Principal que agrupa as duas colunas */}
        <div className="bg-[#1E3A8A] rounded-[32px] p-2 flex flex-col md:flex-row gap-2">
          
          {/* COLUNA ESQUERDA: Informações e Grade */}
          <div className="flex-1 p-8 text-white">
            <h2 className="text-2xl font-bold mb-8">Informações do Produto</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold mb-2 text-white/80">Nome do Produto</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-[#0F172A] rounded-xl p-4 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-xs font-semibold mb-2 text-white/80">Categoria do Produto</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen((s) => !s)}
                    className="w-full flex items-center justify-between bg-[#0F172A] rounded-xl p-4 text-white"
                  >
                    <span>
                      {categoriaId
                        ? categories.find((c) => c.id === categoriaId)?.name
                        : ""}
                    </span>
                    <ChevronDown size={18} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-full bg-[#1E3A8A] border border-white/10 text-white rounded-xl shadow-2xl z-40 max-h-56 overflow-auto">
                      <ul>
                        {categories.map((c) => (
                          <li
                            key={c.id}
                            className="px-4 py-3 hover:bg-[#172554] cursor-pointer"
                            onClick={() => handleSelectCategory(c.id)}
                          >
                            {c.name}
                          </li>
                        ))}
                        <li className="border-t border-white/10" />
                        <li className="px-4 py-3">
                          <button
                            type="button"
                            onClick={handleOpenCreateCategory}
                            className="w-full text-left text-blue-400 font-semibold"
                          >
                            + Criar Nova Categoria
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2 text-white/80">Gênero</label>
                  <div className="bg-[#0F172A] rounded-xl p-4 text-white">
                    <select className="bg-transparent w-full outline-none text-white appearance-none cursor-pointer">
                      <option className="bg-[#0F172A]">Masculino</option>
                      <option className="bg-[#0F172A]">Feminino</option>
                      <option className="bg-[#0F172A]">Unissex</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <h2 className="text-2xl font-bold mb-6">Definição da Grade</h2>
                <div className="flex items-start gap-4 flex-wrap">
                  
                  {/* Itens Adicionados */}
                  {grades.map((g) => (
                    <div key={g.id} className="w-36 h-28 bg-[#0F172A] rounded-2xl flex flex-col items-center justify-center gap-1 relative group">
                      <button
                        type="button"
                        onClick={() => handleRemoveGrade(g.id)}
                        className="absolute top-2 right-2 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                      <div className="text-lg font-bold">{g.tamanho}</div>
                      <div className="text-sm text-white/80">{g.cor}</div>
                      <div className="text-xs text-white/50">{g.quantidade} un.</div>
                    </div>
                  ))}

                  {/* Botões de Adicionar Placeholder (Estilo Mockup) */}
                  <button
                    type="button"
                    onClick={() => setIsGradeModalOpen(true)}
                    className="w-36 h-28 bg-[#0F172A] hover:bg-[#0F172A]/80 transition-colors rounded-2xl flex flex-col items-center justify-center text-white/50"
                  >
                    <Plus size={24} className="mb-2 text-white/30" />
                    <span className="text-[10px]">Tamanho, Cor, Unidade</span>
                  </button>
                  
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Mídia e Preço */}
          <div className="w-full md:w-[380px] bg-[#172554] rounded-[28px] p-8 text-white flex flex-col">
            <h2 className="text-xl font-bold mb-6">Mídia e Preço</h2>
            
            <div className="space-y-6 flex-1">
              <div className="w-full h-48 border-[1px] border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/5 transition">
                <Upload size={48} className="text-blue-500/80 stroke-1" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-white/80">Custo de Fábrica</label>
                <input
                  type="number"
                  step="0.01"
                  value={custoBase}
                  onChange={(e) => setCustoBase(e.target.value)}
                  className="w-full bg-[#0F172A] rounded-xl p-4 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-white/80">Venda Sugerida</label>
                <input
                  type="number"
                  step="0.01"
                  value={precoVendaBase}
                  onChange={(e) => setPrecoVendaBase(e.target.value)}
                  className="w-full bg-[#0F172A] rounded-xl p-4 text-white outline-none"
                />
              </div>
            </div>

            <div className="pt-8">
              <button
                type="submit"
                className="w-full bg-[#0080ff] hover:bg-blue-500 transition-colors text-white font-bold rounded-xl py-4"
              >
                Cadastrar Produto
              </button>
            </div>
          </div>

        </div>
      </form>

      {/* MODAL: Nova Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="relative bg-[#1E3A8A] text-white rounded-3xl w-full max-w-md p-8 z-50 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nova Categoria</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-white/50 hover:text-white">
                <X />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">Nome da Categoria</label>
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-[#0F172A] rounded-xl p-4 text-white outline-none"
                  placeholder="Ex: Calças Jeans"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">Descrição (opcional)</label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="w-full bg-[#0F172A] rounded-xl p-4 text-white outline-none min-h-[100px] resize-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-3 text-white/70 font-semibold hover:text-white transition">
                  Cancelar
                </button>
                <button onClick={handleSaveCategory} className="flex-1 bg-[#2563EB] hover:bg-blue-500 rounded-xl font-bold py-3 transition">
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nova Variação de Grade */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsGradeModalOpen(false)} />
          <div className="relative bg-[#1E3A8A] text-white rounded-3xl w-full max-w-lg p-8 z-50 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nova Variação</h2>
              <button onClick={() => setIsGradeModalOpen(false)} className="text-white/50 hover:text-white">
                <X />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">Tamanho</label>
                <input
                  value={gradeTamanho}
                  onChange={(e) => setGradeTamanho(e.target.value)}
                  className="w-full bg-[#0F172A] rounded-xl p-4 text-white outline-none"
                  placeholder="Ex: M"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">Cor</label>
                <input
                  value={gradeCor}
                  onChange={(e) => setGradeCor(e.target.value)}
                  className="w-full bg-[#0F172A] rounded-xl p-4 text-white outline-none"
                  placeholder="Ex: Preto"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2 text-white/80">Qtd. em Estoque</label>
                <input
                  type="number"
                  value={gradeQuantidade as any}
                  onChange={(e) => setGradeQuantidade(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-[#0F172A] rounded-xl p-4 text-white outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-8">
              <button onClick={() => setIsGradeModalOpen(false)} className="flex-1 py-3 text-white/70 font-semibold hover:text-white transition">
                Cancelar
              </button>
              <button onClick={handleAddGrade} className="flex-1 bg-[#2563EB] hover:bg-blue-500 rounded-xl font-bold py-3 transition">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}