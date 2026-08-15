"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { apiFetch } from "@/src/lib/api";
import { setToken } from "@/src/lib/auth-token";
import { useAuth } from "@/src/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); 

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redireciona automaticamente para o dashboard se o usuário já estiver autenticado
  useEffect(() => {
    if (!loading && user) {
      router.push('/inicio');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Erro ao autenticar. Verifique suas credenciais.');
        setIsLoading(false);
        return;
      }

      setToken(data.token);
      router.push('/inicio');
    } catch (err) {
      setError('Erro de conexão com o servidor.');
      setIsLoading(false);
    }
  };

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
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Mensagem de Erro */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F1F5F9] border border-transparent text-[#334155] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all disabled:opacity-50"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-[#F1F5F9] border border-transparent text-[#334155] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all disabled:opacity-50"
                required
              />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#334155] transition-colors disabled:opacity-50"
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
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold shadow-md shadow-[#2563EB]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Autenticando..." : "Entrar no Sistema"}
        </button>
      </form>

      {/* Rodapé */}
      <div className="pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Ainda não tem uma conta?{" "}
          <Link href="/cadastro" className="text-[#2563EB] hover:text-[#1E3A8A] font-semibold transition-colors">
            Crie sua conta
          </Link>
        </p>
      </div>
    </div>
  );
}