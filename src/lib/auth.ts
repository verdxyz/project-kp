import type { Pengguna, UserRole } from './types'

export interface AuthUser extends Pengguna {
  unit?: string
  telepon?: string
}

export const DEFAULT_USERS: AuthUser[] = [
  {
    id: 'USR-001',
    nama: 'Arya Wirawan, S.T., M.M.',
    email: 'admin@telkom.co.id',
    password: 'admin123',
    role: 'admin',
    avatar_initials: 'AW',
    unit: 'Divisi B2G & Enterprise Jateng Utara',
    telepon: '0812-2800-1001',
    created_at: '2024-01-01T08:00:00Z',
  },
  {
    id: 'USR-002',
    nama: 'Budi Santoso, S.Kom.',
    email: 'am.semarang@telkom.co.id',
    password: 'am123',
    role: 'am',
    avatar_initials: 'BS',
    unit: 'Account Manager Witel Jateng Utara',
    telepon: '0813-9022-3344',
    created_at: '2024-01-15T09:30:00Z',
  },
  {
    id: 'USR-003',
    nama: 'Verdy Rizky (Intern/Viewer)',
    email: 'viewer@telkom.co.id',
    password: 'viewer123',
    role: 'viewer',
    avatar_initials: 'VR',
    unit: 'Government Business Intern',
    telepon: '0857-1234-5678',
    created_at: '2024-02-01T10:00:00Z',
  },
]

const AUTH_STORAGE_KEY = 'b2g_telkom_auth_user'
const USERS_LIST_KEY = 'b2g_telkom_users_list'

export const AuthService = {
  getUsers(): AuthUser[] {
    try {
      const stored = localStorage.getItem(USERS_LIST_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    } catch {
      return DEFAULT_USERS
    }
  },

  getCurrentUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },

  login(email: string, password: string): { success: boolean; user?: AuthUser; message?: string } {
    const users = this.getUsers()
    const user = users.find(
      (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
    )

    if (!user) {
      return { success: false, message: 'Email tidak terdaftar dalam sistem Telkom B2G.' }
    }

    if (user.password !== password) {
      return { success: false, message: 'Kata sandi salah. Silakan coba lagi.' }
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    } catch (e) {
      console.error('Failed to save session', e)
    }

    return { success: true, user }
  },

  logout(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch (e) {
      console.error('Failed to clear session', e)
    }
  },
}
