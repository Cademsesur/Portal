/**
 * Client HTTP centralisé.
 * - Inclut les cookies (httpOnly JWT) → credentials: 'include'
 * - Lance ApiError sur statuts >= 400
 * - Single point of entry pour intercepter 401 → redirect /login (à brancher)
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends RequestInit {
  json?: unknown;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.status);
    throw new ApiError(response.status, payload, message);
  }

  return payload as T;
}

/**
 * Variante binaire de `apiFetch` : renvoie un Blob (téléchargement de fichiers).
 * Conserve l'envoi des cookies httpOnly et la gestion d'ApiError.
 */
export async function apiFetchBlob(
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  const { json, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: { ...(headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!response.ok) {
    const isJson = response.headers
      .get('content-type')
      ?.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();
    throw new ApiError(
      response.status,
      payload,
      extractErrorMessage(payload, response.status),
    );
  }

  return response.blob();
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'object' && payload !== null) {
    const p = payload as { message?: unknown; errors?: unknown };
    if (Array.isArray(p.errors) && p.errors.length > 0) {
      return p.errors
        .map((e) => {
          if (typeof e === 'object' && e && 'message' in e) {
            const obj = e as { path?: unknown[]; message: unknown };
            const path = Array.isArray(obj.path) ? obj.path.join('.') : '';
            return path ? `${path}: ${String(obj.message)}` : String(obj.message);
          }
          return String(e);
        })
        .join(' ; ');
    }
    if (Array.isArray(p.message)) return p.message.join(' ; ');
    if (typeof p.message === 'string') return p.message;
  }
  return `Request failed: ${status}`;
}
