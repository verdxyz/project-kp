import React, { useState } from 'react'
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Briefcase,
  Eye as EyeIcon,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react'
import { AuthService, DEFAULT_USERS, type AuthUser } from '../lib/auth'

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Harap masukkan email dan kata sandi.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      const res = AuthService.login(email, password)
      setLoading(false)
      if (res.success && res.user) {
        onLoginSuccess(res.user)
      } else {
        setError(res.message || 'Login gagal.')
      }
    }, 400)
  }

  const handleQuickLogin = (demoUser: AuthUser) => {
    setEmail(demoUser.email)
    setPassword(demoUser.password)
    setError(null)
    setLoading(true)
    setTimeout(() => {
      const res = AuthService.login(demoUser.email, demoUser.password)
      setLoading(false)
      if (res.success && res.user) {
        onLoginSuccess(res.user)
      }
    }, 300)
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header Bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/60 backdrop-blur-md bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/30 border border-red-500/30">
            <span className="font-extrabold text-white text-base tracking-wider">T</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-wide">B2Gov Portal</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Telkom Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Monitoring Pipeline Pengadaan Pemerintah (Salatiga – Brebes)</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <Building2 size={13} className="text-red-400" />
          <span>Witel Jateng Utara</span>
        </div>
      </header>

      {/* Center Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Context & Overview */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <Sparkles size={13} className="text-red-400 animate-pulse" />
              <span>Sistem Monitoring Proyek Magang B2G</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Kelola Pipeline <br />
                <span className="bg-gradient-to-r from-red-400 via-rose-300 to-blue-400 bg-clip-text text-transparent">
                  Pengadaan Pemerintah
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Pantau proses tender SiRUP LKPP, progres tahapan F0 sampai Win, kepatuhan dokumen P0/P1, serta alur kontrak mitra secara terintegrasi.
              </p>
            </div>

            {/* Coverage Badges */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Activity size={13} className="text-emerald-400" />
                  Cakupan 13 Instansi Target
                </span>
                <span className="text-[11px] text-slate-500">Witel Jateng Utara</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Kota Salatiga • Kab. Semarang • Kota Semarang • Kab. Kendal • Kab. Batang • Kab. & Kota Pekalongan • Kab. Pemalang • Kab. & Kota Tegal • Kab. Brebes • Pemprov Jateng • Polda Jateng.
              </p>
            </div>

            {/* Quick Demo Selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={14} className="text-red-400" />
                Pilih Akun Demo (1-Click Login):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DEFAULT_USERS.map((u) => {
                  const roleStyle =
                    u.role === 'admin'
                      ? 'border-red-500/40 hover:border-red-500 bg-red-500/5'
                      : u.role === 'am'
                      ? 'border-blue-500/40 hover:border-blue-500 bg-blue-500/5'
                      : 'border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5'

                  const badgeColor =
                    u.role === 'admin'
                      ? 'bg-red-500/20 text-red-300'
                      : u.role === 'am'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-emerald-500/20 text-emerald-300'

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u)}
                      className={`text-left p-2.5 rounded-xl border transition-all duration-200 group hover:scale-[1.02] ${roleStyle}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${badgeColor}`}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'am' ? 'AM' : 'Viewer'}
                        </span>
                        <ArrowRight size={12} className="text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{u.nama.split(' ')[0]}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email.split('@')[0]}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60 relative">
              
              {/* Card Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Masuk ke Portal</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gunakan email Telkom atau pilih salah satu akun demo di samping.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Akun Telkom</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh: am.semarang@telkom.co.id"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">Kata Sandi</label>
                    <span className="text-[11px] text-slate-500">Default: password sesuai peran</span>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 hover:from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-red-900/40 hover:shadow-red-800/60 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Memverifikasi Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Dashboard</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Footnote */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  Sesi aman (LocalStorage session)
                </span>
                <span>v1.2.0 • Build Magang</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-3 border-t border-slate-800/60 text-center text-xs text-slate-500 backdrop-blur-md bg-slate-900/30">
        © 2026 PT Telkom Indonesia (Persero) Tbk — Divisi Government Enterprise Witel Jateng Utara
      </footer>
    </div>
  )
}
