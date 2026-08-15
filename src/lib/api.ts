import { getToken, clearToken } from './auth-token';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function apiFetch(path: string, options: RequestInit = {}) {
  // 1. Inicializa a classe nativa de cabeçalhos herdando o que já veio nas options
  const headers = new Headers(options.headers);

  // 2. Define os padrões se eles ainda não existirem
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // 3. Anexa o Bearer token salvo no localStorage, quando existir
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 4. Executa a requisição
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers, // Passa a nossa classe Headers formatada
  });

  // 5. Sessão expirada ou token revogado: limpa o token salvo.
  // Não força redirecionamento aqui para não acoplar o apiFetch ao roteador —
  // isso fica a cargo de quem chamou.
  if (res.status === 401) {
    clearToken();
  }

  return res;
}
