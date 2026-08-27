import { getToken, clearToken } from './auth-token';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Lê o cookie XSRF-TOKEN que o Laravel Sanctum define ao chamar
// /sanctum/csrf-cookie, e o decodifica (o Laravel URL-encoda o valor).
function getXsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Garante que o cookie XSRF-TOKEN existe antes de requisições que mutam
// estado (POST/PUT/PATCH/DELETE), exigido pelo fluxo stateful do Sanctum.
async function ensureCsrfCookie() {
  if (getXsrfTokenFromCookie()) return;
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method ?? 'GET').toUpperCase();

  if (!SAFE_METHODS.has(method)) {
    await ensureCsrfCookie();
  }

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

  // 3b. Anexa o header X-XSRF-TOKEN exigido pelo fluxo stateful do Sanctum
  // em requisições que mutam estado.
  if (!SAFE_METHODS.has(method)) {
    const xsrfToken = getXsrfTokenFromCookie();
    if (xsrfToken) {
      headers.set('X-XSRF-TOKEN', xsrfToken);
    }
  }

  // 4. Executa a requisição
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers, // Passa a nossa classe Headers formatada
    credentials: 'include', // Envia/recebe os cookies de sessão e XSRF-TOKEN
  });

  // 5. Sessão expirada ou token revogado: limpa o token salvo.
  // Não força redirecionamento aqui para não acoplar o apiFetch ao roteador —
  // isso fica a cargo de quem chamou.
  if (res.status === 401) {
    clearToken();
  }

  return res;
}
