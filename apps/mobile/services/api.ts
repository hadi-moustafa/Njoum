// ============================================================
// API service — thin wrapper around fetch for the Njoum API
// Automatically attaches the Supabase access token.
// ============================================================
import { supabase } from './supabase';
import { ApiResponse } from '@njoum/shared';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<ApiResponse<T>> {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'ar',   // TODO: pull from i18n store
      ...authHeader,
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json: ApiResponse<T> = await res.json();
  return json;
}

export const api = {
  get:    <T>(path: string, headers?: Record<string, string>) =>
    request<T>('GET', path, undefined, headers),
  post:   <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch:  <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string)               => request<T>('DELETE', path),
};
