// Orval mutator: every generated request goes through here.
// Base URL and error normalization live here; auth, If-Match and
// Idempotency-Key headers are added here when the cart API lands.

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = async <T>(url: string, init?: RequestInit): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${url}`, init);
  } catch (e) {
    throw new ApiError(0, 'NETWORK_ERROR', e instanceof Error ? e.message : 'Network request failed');
  }

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = undefined;
  }

  if (!res.ok) {
    const err = body as { code?: unknown; message?: unknown } | undefined;
    throw new ApiError(
      res.status,
      typeof err?.code === 'string' ? err.code : 'UNKNOWN_ERROR',
      typeof err?.message === 'string' ? err.message : `HTTP ${res.status}`,
    );
  }

  return body as T;
};
