export interface AuthUser {
  id: string
  nama: string
  email: string
}

interface AuthResponse {
  user?: AuthUser
  message?: string
}

let currentUser: AuthUser | null = null

async function readResponse(response: Response): Promise<AuthResponse> {
  const body = await response.json().catch(() => ({})) as AuthResponse
  if (!response.ok) {
    throw new Error(body.message || 'Permintaan autentikasi gagal.')
  }
  return body
}

export const AuthService = {
  getCurrentUser(): AuthUser | null {
    return currentUser
  },

  async restoreSession(): Promise<AuthUser | null> {
    try {
      localStorage.removeItem('b2g_telkom_auth_user')
      localStorage.removeItem('b2g_telkom_users_list')
    } catch (error) {
      console.error('Failed to clear legacy browser-stored credentials:', error)
    }
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' })
    if (response.status === 401) {
      currentUser = null
      return null
    }
    const body = await readResponse(response)
    currentUser = body.user ?? null
    return currentUser
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await readResponse(response)
      currentUser = body.user ?? null
      return { success: Boolean(currentUser), user: currentUser ?? undefined }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login gagal.',
      }
    }
  },

  async logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    })
    if (!response.ok && response.status !== 401) {
      const body = await response.json().catch(() => ({})) as AuthResponse
      throw new Error(body.message || 'Gagal mengakhiri sesi.')
    }
    currentUser = null
  },
}
