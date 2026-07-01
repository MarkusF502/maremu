export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// Função auxiliar para ler os cookies salvos no navegador
function getCookie(name: string) {
  if (typeof document === 'undefined') return null; 
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

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

  // 3. Lê o cookie e injeta no cabeçalho usando o método .set()
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    headers.set('X-XSRF-TOKEN', csrfToken);
  }

  // 4. Executa a requisição
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers, // Passa a nossa classe Headers formatada
  });

  return res;
}