"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col items-center space-y-3">
        {/* Ícone remetendo ao Logo M do Brand Kit */}
        <div className="w-40 h-24 relative flex items-center justify-center">
            <Image 
                src="/logo.png" 
                alt="Logo Maremu" 
                fill
                className="object-contain"
                priority
            />
            </div>
        <div className="text-center space-y-1 mt-2">
          <h1 className="text-2xl font-bold text-[#334155] tracking-tight">Bem-vindo de volta</h1>
          <p className="text-sm text-slate-500">Faça login para gerenciar sua loja.</p>
        </div>
      </div>

      {/* Formulário */}
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
          {/* Campo E-mail */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-[#334155]">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F1F5F9] border border-transparent text-[#334155] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                required
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-[#334155]">
                Senha
              </label>
              <Link href="#" className="text-sm font-medium text-[#2563EB] hover:text-[#1E3A8A] transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
              type={showPassword ? "text" : "password"}
                placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-[#F1F5F9] border border-transparent text-[#334155] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                required
              />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#334155] transition-colors"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            </div>
          </div>
        </div>

        {/* Botão Submit (Primary Blue do Brand Kit) */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold shadow-md shadow-[#2563EB]/20 transition-all active:scale-[0.98]"
        >
          Entrar no Sistema
        </button>
      </form>

      {/* Rodapé */}
      <div className="pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Ainda não tem uma conta?{" "}
          <Link href="#" className="text-[#2563EB] hover:text-[#1E3A8A] font-semibold transition-colors">
            Teste grátis
          </Link>
        </p>
      </div>
    </div>
  );
}