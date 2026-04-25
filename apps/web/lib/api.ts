// Server-side API helper — attaches service-role key for admin operations.
// Never use SUPABASE_SERVICE_ROLE_KEY on the client.

const BASE_URL = process.env.API_URL ?? 'http://localhost:3001/api/v1';

// Called from Server Components / Route Handlers with the admin's access token.
export async function adminApi<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<{ success: boolean; data: T | null; error: { message: string } | null; meta: unknown }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    return res.json();
  } catch {
    // API server unreachable — return empty payload so pages render with no data
    return { success: false, data: null, error: { message: 'API server offline' }, meta: null };
  }
}

export const api = {
  get:   <T>(path: string, token: string)                => adminApi<T>('GET',    path, token),
  post:  <T>(path: string, token: string, body: unknown)  => adminApi<T>('POST',   path, token, body),
  patch: <T>(path: string, token: string, body: unknown)  => adminApi<T>('PATCH',  path, token, body),
  del:   <T>(path: string, token: string)                => adminApi<T>('DELETE', path, token),
};
