import React, { useState } from 'react'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react'
import { AuthService, type AuthUser } from '../lib/auth'

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Harap masukkan email dan kata sandi.')
      return
    }

    setLoading(true)
    try {
      const res = await AuthService.login(email, password)
      if (res.success && res.user) {
        onLoginSuccess(res.user)
      } else {
        setError(res.message || 'Login gagal.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#666666] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] rounded-full pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
      />

      {/* Center Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col justify-center text-center lg:text-left">
            <h1 className="text-6xl font-extrabold leading-tight tracking-tight text-[#111111] sm:text-7xl">
              <span className="block">SIMPUL</span>
              <span className="text-[#111111]">Jateng</span>
            </h1>
            <p className="mt-6 text-3xl font-semibold leading-tight text-[#444444] md:text-4xl">
              Sistem Informasi Manajemen Proyek dan Layanan
            </p>
          </div>

          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 relative">
              
              {/* Card Header */}
              <div className="mb-6">
                <h2 className="text-center text-xl font-bold text-[#1C1C1E]">
                  Masuk ke Portal
                </h2>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-[#F3F3F1] border border-[#E5E5E5] flex items-start gap-2.5 text-xs text-[#666666]">
                  <AlertCircle size={15} className="text-[#666666] flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-[#666666] mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1C1C1E] placeholder:text-[#666666] focus:outline-none focus:border-[#E5E5E5] focus:ring-1 focus:ring-[#E5E5E5] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#666666]">Kata Sandi</label>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1C1C1E] placeholder:text-[#666666] focus:outline-none focus:border-[#E5E5E5] focus:ring-1 focus:ring-[#E5E5E5] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#666666]"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-black hover:bg-black text-[#1C1C1E] font-semibold text-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#E5E5E5]/30 border-t-white rounded-full animate-spin" />
                        <span>Memverifikasi Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>


    </div>
  )
}
