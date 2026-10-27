export async function apiRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(url, { ...init, headers, credentials: 'include' })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(result?.message || `Permintaan gagal (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
