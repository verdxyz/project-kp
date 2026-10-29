import { csrfHeaders } from './csrf'

export async function apiRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const method = (init.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    for (const [key, value] of Object.entries(csrfHeaders())) headers.set(key, value)
  }
  const response = await fetch(url, { ...init, headers, credentials: 'include' })
  const responseBody = response.status === 204 ? '' : await response.text()
  let result: { message?: string } | null = null
  if (responseBody) {
    try {
      const parsed: unknown = JSON.parse(responseBody)
      if (typeof parsed === 'object' && parsed !== null && 'message' in parsed && typeof parsed.message === 'string') {
        result = { message: parsed.message }
      }
    } catch {
      if (response.ok) {
        throw new Error(`Server mengembalikan respons bukan JSON (HTTP ${response.status}). Periksa log server.`)
      }
    }
  }
  if (!response.ok) {
    throw new Error(result?.message || `Permintaan gagal (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  try {
    return JSON.parse(responseBody) as T
  } catch {
    throw new Error(`Server mengembalikan respons bukan JSON (HTTP ${response.status}). Periksa log server.`)
  }
}
