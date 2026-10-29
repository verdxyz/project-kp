import { readJsonResponse } from './apiResponse'
import { csrfHeaders } from './csrf'

export interface AuthUser {
  id: string
  nama: string
  email: string
}

export const AuthService = {
  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem('b2g_current_user')
    if (!raw) return null
    try { return JSON.parse(raw) as AuthUser } catch { return null }
  },

  async restoreSession(): Promise<AuthUser | null> {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      })
      if (!response.ok) {
        localStorage.removeItem('b2g_current_user')
        return null
      }
      const { user } = await response.json() as { user: AuthUser }
      localStorage.setItem('b2g_current_user', JSON.stringify(user))
      return user
    } catch {
      localStorage.removeItem('b2g_current_user')
      return null
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { ...csrfHeaders(), Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const result = await readJsonResponse<{ user?: AuthUser; message?: string }>(response)
      if (!response.ok || !result.user) return { success: false, message: result.message || 'Login gagal.' }
      const user = result.user
      localStorage.setItem('b2g_current_user', JSON.stringify(user))
      return { success: true, user }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login gagal.',
      }
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { ...csrfHeaders(), Accept: 'application/json' },
        credentials: 'include',
      })
    } finally {
      localStorage.removeItem('b2g_current_user')
    }
  },
}
