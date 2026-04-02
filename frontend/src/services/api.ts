/* ══════════════════════════════════════════
   api.ts — Base Axios instance + helpers
   ══════════════════════════════════════════ */

import axios, { AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

/* ── Response interceptor: normalise errors ── */
apiClient.interceptors.response.use(
  res => res,
  (err: AxiosError<{ detail?: string }>) => {
    const message =
      err.response?.data?.detail ??
      err.message ??
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)

/* ── Typed GET / POST wrappers ── */
export async function get<T>(path: string): Promise<T> {
  const { data } = await apiClient.get<T>(path)
  return data
}

export async function post<T, B = unknown>(path: string, body: B): Promise<T> {
  const { data } = await apiClient.post<T>(path, body)
  return data
}
