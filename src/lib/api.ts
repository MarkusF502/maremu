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

// Garante que existe um cookie XSRF-TOKEN antes de requisições que mutam
// estado (POST/PUT/PATCH/DELETE), exigido pelo fluxo stateful do Sanctum.
// `force` ignora um cookie já existente e busca um novo mesmo assim — usado
// no retry de 419 abaixo, porque um XSRF-TOKEN presente não é garantia de
// que ele ainda é válido (sessão expirada, cookie de uma execução anterior
// do backend, etc.) e o Sanctum não tem como "consertar" um token velho.
async function ensureCsrfCookie(force = false) {
  if (!force && getXsrfTokenFromCookie()) return;
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
}

function buildHeaders(options: RequestInit, method: string): Headers {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Anexa o header X-XSRF-TOKEN exigido pelo fluxo stateful do Sanctum em
  // requisições que mutam estado.
  if (!SAFE_METHODS.has(method)) {
    const xsrfToken = getXsrfTokenFromCookie();
    if (xsrfToken) {
      headers.set('X-XSRF-TOKEN', xsrfToken);
    }
  }

  return headers;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const isMutating = !SAFE_METHODS.has(method);

  if (isMutating) {
    await ensureCsrfCookie();
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options, method),
    credentials: 'include', // Envia/recebe os cookies de sessão e XSRF-TOKEN
  });

  // 419 = CSRF token mismatch. Acontece quando o cookie XSRF-TOKEN que já
  // existia no navegador ficou desatualizado (sessão expirada, cookie de
  // antes de reiniciar o backend, etc.) — ensureCsrfCookie() acima não
  // detecta isso sozinho porque só checa se o cookie *existe*, não se ele
  // ainda é válido. Busca um cookie novo à força e tenta a requisição uma
  // única vez de novo antes de desistir.
  if (res.status === 419 && isMutating) {
    await ensureCsrfCookie(true);
    const retryRes = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: buildHeaders(options, method),
      credentials: 'include',
    });

    if (retryRes.status === 401) {
      clearToken();
    }

    return retryRes;
  }

  // Sessão expirada ou token revogado: limpa o token salvo.
  // Não força redirecionamento aqui para não acoplar o apiFetch ao roteador —
  // isso fica a cargo de quem chamou.
  if (res.status === 401) {
    clearToken();
  }

  return res;
}
