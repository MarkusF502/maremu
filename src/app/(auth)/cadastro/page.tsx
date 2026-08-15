"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { apiFetch } from "@/src/lib/api";
import { setToken } from "@/src/lib/auth-token";
import { useAuth } from "@/src/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); 

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redireciona se o usuário já estiver logado (evita acessar a tela de cadastro à toa)
  useEffect(() => {
    if (!loading && user) {
      router.push('/inicio');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validação básica de senha no frontend antes de bater na API
    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      // Dispara a criação da conta (Ajuste a rota se estiver diferente no seu backend)
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // O Laravel costuma retornar os erros de validação dentro de 'errors'
        if (data.errors) {
            const firstError = Object.values(data.errors)[0] as string[];
            setError(firstError[0]);
        } else {
            setError(data.message ?? 'Erro ao criar conta. Verifique os dados.');
        }
        setIsLoading(false);
        return;
      }

      // Sucesso! Salva o token de acesso e, como o usuário acabou de ser
      // criado e não tem loja, manda ele direto para o fluxo de onboarding.
      setToken(data.token);
      router.push('/onboarding');

    } catch (err) {
      setError('Erro de conexão com o servidor.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-8 my-8">
      {/* Cabeçalho */}
      <div className="flex flex-col items-center space-y-3">
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
          <h1 className="text-2xl font-bold text-[#334155] tracking-tight">Crie sua conta</h1>
          <p className="text-sm text-slate-500">Primeiro passo para gerenciar sua loja.</p>
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

          {/* Campo Nome */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-semibold text-[#334155]">
              Nome Completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="João da Silva"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F1F5F9] border border-transparent text-[#334155] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

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
            <label htmlFor="password" className="text-sm font-semibold text-[#334155]">
              Senha
            </label>
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
                placeholder="Mínimo 6 caracteres"
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

          {/* Campo Confirmação de Senha */}
          <div className="space-y-1.5">
            <label htmlFor="passwordConfirmation" className="text-sm font-semibold text-[#334155]">
              Confirme a Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="passwordConfirmation"
                type={showPassword ? "text" : "password"}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                disabled={isLoading}
                placeholder="Repita sua senha"
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-[#F1F5F9] border border-transparent text-[#334155] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>
        </div>

        {/* Botão Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1E3A8A] text-white font-bold shadow-md shadow-[#2563EB]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Criando conta..." : "Criar Conta"}
        </button>
      </form>

      {/* Rodapé */}
      <div className="pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Já possui uma conta?{" "}
          <Link href="/login" className="text-[#2563EB] hover:text-[#1E3A8A] font-semibold transition-colors">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}