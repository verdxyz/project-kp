import React, { useState, useEffect, useCallback } from "react"
import { Wifi, Plus, Search, Edit3, Trash2, X, Check, AlertCircle, ChevronDown, Zap, Globe, Network, Shield } from "lucide-react"
import { cn } from "../lib/utils"
import { ServicesDB } from "../lib/db"
import type { ServiceItem } from "../lib/db"

const SEED_SERVICES = [
  { name: "Astinet Dedicated 100 Mbps", category: "On Channel", serviceType: "Astinet", bandwidth: "100 Mbps", sla: "99.5%", priceMonthly: 8500000, description: "Layanan internet dedicated enterprise berkecepatan tinggi dengan SLA terjamin", features: ["IP Publik Statis", "SLA 99.5%", "Monitoring 24/7", "Redundant Path"], status: "Aktif" },
  { name: "Astinet Dedicated 50 Mbps", category: "On Channel", serviceType: "Astinet", bandwidth: "50 Mbps", sla: "99.5%", priceMonthly: 4800000, description: "Layanan internet dedicated untuk instansi skala menengah", features: ["IP Publik Statis", "SLA 99.5%", "Monitoring 24/7"], status: "Aktif" },
  { name: "VPN IP MPLS Premium", category: "On Channel", serviceType: "VPN IP", bandwidth: "Fleksibel", sla: "99.9%", priceMonthly: 12000000, description: "Jaringan privat antar kantor dengan teknologi MPLS untuk keamanan data tinggi", features: ["MPLS Backbone", "QoS Priority", "SLA 99.9%", "Multi-site", "Traffic Engineering"], status: "Aktif" },
  { name: "Metro Ethernet 1 Gbps", category: "On Channel", serviceType: "Metro Ethernet", bandwidth: "1 Gbps", sla: "99.9%", priceMonthly: 18000000, description: "Koneksi fiber optik metro area dengan throughput sangat tinggi", features: ["Fiber Optik", "Full Duplex", "SLA 99.9%", "Low Latency < 5ms"], status: "Aktif" },
  { name: "SD-WAN Enterprise", category: "On Channel", serviceType: "SD-WAN", bandwidth: "Multi-link", sla: "99.8%", priceMonthly: 22000000, description: "Software-defined WAN untuk manajemen jaringan terpusat dan otomatis", features: ["Zero-touch Provisioning", "Centralized Dashboard", "Traffic Optimization", "Built-in Security"], status: "Aktif" },
]

const SERVICE_ICONS = { "Astinet": Globe, "VPN IP": Shield, "Metro Ethernet": Network, "SD-WAN": Zap, "Lainnya": Wifi }
const SERVICE_COLORS = {
  "Astinet": "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
  "VPN IP": "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400",
  "Metro Ethernet": "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
  "SD-WAN": "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
  "Lainnya": "from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-400",
}

function formatIDR(n) {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1).replace(".0", "")} jt`
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)} rb`
  return `Rp ${n.toLocaleString("id-ID")}`
}

function blankForm() {
  return { name: "", category: "On Channel", serviceType: "Astinet", bandwidth: "", sla: "99.5%", priceMonthly: 0, priceOTC: undefined, description: "", features: [""], status: "Aktif" }
}

function ServiceModal({ mode, initial, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const setFeature = (idx, val) => { const next = [...form.features]; next[idx] = val; set("features", next) }
  const addFeature = () => set("features", [...form.features, ""])
  const removeFeature = (idx) => set("features", form.features.filter((_, i) => i !== idx))
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = "Nama layanan wajib diisi"
    if (form.priceMonthly <= 0) e.priceMonthly = "Harga bulanan harus lebih dari 0"
    if (!form.description.trim()) e.description = "Deskripsi wajib diisi"
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const handleSubmit = (e) => { e.preventDefault(); if (!validate()) return; onSave({ ...form, features: form.features.filter(f => f.trim()) }) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center"><Wifi size={16} className="text-blue-400" /></div>
            <h3 className="text-base font-bold text-white">{mode === "add" ? "Tambah Layanan Baru" : "Edit Layanan"}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Layanan *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Contoh: Astinet Dedicated 100 Mbps" className={cn("form-input", errors.name && "border-red-500/60")} />
            {errors.name && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kategori</label>
              <div className="relative">
                <select value={form.category} onChange={e => set("category", e.target.value)} className="form-input appearance-none pr-8">
                  <option value="On Channel">On Channel</option>
                  <option value="GTMA">GTMA</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tipe Layanan</label>
              <div className="relative">
                <select value={form.serviceType} onChange={e => set("serviceType", e.target.value)} className="form-input appearance-none pr-8">
                  {["Astinet", "VPN IP", "Metro Ethernet", "SD-WAN", "Lainnya"].map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Bandwidth</label>
              <input value={form.bandwidth ?? ""} onChange={e => set("bandwidth", e.target.value)} placeholder="Contoh: 100 Mbps" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">SLA</label>
              <input value={form.sla} onChange={e => set("sla", e.target.value)} placeholder="Contoh: 99.5%" className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Harga Monthly (Rp) *</label>
              <input type="number" value={form.priceMonthly || ""} onChange={e => set("priceMonthly", Number(e.target.value))} placeholder="0" className={cn("form-input", errors.priceMonthly && "border-red-500/60")} />
              {errors.priceMonthly && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.priceMonthly}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Harga OTC (Rp)</label>
              <input type="number" value={form.priceOTC ?? ""} onChange={e => set("priceOTC", e.target.value ? Number(e.target.value) : undefined)} placeholder="Opsional" className="form-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Deskripsi *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Jelaskan layanan ini secara singkat..." className={cn("form-input resize-none", errors.description && "border-red-500/60")} />
            {errors.description && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.description}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400">Fitur / Keunggulan</label>
              <button type="button" onClick={addFeature} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"><Plus size={12} /> Tambah</button>
            </div>
            <div className="space-y-2">
              {form.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={f} onChange={e => setFeature(i, e.target.value)} placeholder={`Fitur ${i + 1}`} className="form-input flex-1" />
                  {form.features.length > 1 && <button type="button" onClick={() => removeFeature(i)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={14} /></button>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
            <div className="flex gap-3">
              {["Aktif", "Tidak Aktif"].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => set("status", s)} className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer", form.status === s ? "border-blue-500 bg-blue-500" : "border-slate-600")}>
                    {form.status === s && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-slate-300">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"><Check size={15} />{mode === "add" ? "Simpan Layanan" : "Update Layanan"}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ServiceCard({ item, onEdit, onDelete }) {
  const Icon = SERVICE_ICONS[item.serviceType] ?? Wifi
  const colorClass = SERVICE_COLORS[item.serviceType] ?? SERVICE_COLORS["Lainnya"]
  return (
    <div className={cn("group relative rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5", colorClass)}>
      <div className="absolute top-4 right-4">
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", item.status === "Aktif" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-700 text-slate-500 border border-slate-600")}>{item.status}</span>
      </div>
      <div className="flex items-start gap-3 mb-4">
        <div className={cn("w-10 h-10 rounded-xl border bg-gradient-to-br flex items-center justify-center flex-shrink-0", colorClass)}><Icon size={20} /></div>
        <div className="min-w-0 pr-16">
          <h3 className="text-sm font-bold text-white leading-tight truncate">{item.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400">{item.serviceType}</span>
            {item.bandwidth && <><span className="text-slate-600">·</span><span className="text-xs text-slate-400">{item.bandwidth}</span></>}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
      {item.features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.features.slice(0, 3).map(f => <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700 text-slate-400">{f}</span>)}
          {item.features.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700 text-slate-500">+{item.features.length - 3}</span>}
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/40">
        <div><p className="text-xs text-slate-500">Monthly</p><p className="text-sm font-bold text-white">{formatIDR(item.priceMonthly)}</p></div>
        <div className="text-right"><p className="text-xs text-slate-500">SLA</p><p className="text-sm font-semibold text-emerald-400">{item.sla}</p></div>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={onEdit} className="p-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/40 transition-colors" title="Edit"><Edit3 size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors" title="Hapus"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

export function ServicesCatalog() {
  const [services, setServices] = useState([])
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("Semua")
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const load = useCallback(() => setServices(ServicesDB.getAll()), [])
  useEffect(() => { ServicesDB.seed(SEED_SERVICES); load() }, [load])
  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "Semua" || s.serviceType === filterType
    return matchSearch && matchType
  })
  const handleSave = (data) => {
    if (modal?.mode === "add") ServicesDB.create(data)
    else if (modal?.editId) ServicesDB.update(modal.editId, data)
    load(); setModal(null)
  }
  const handleDelete = (id) => { ServicesDB.delete(id); load(); setDeleteConfirm(null) }
  const getEditInitial = (id) => {
    const svc = ServicesDB.getById(id)
    if (!svc) return blankForm()
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = svc
    return rest
  }
  const SERVICE_TYPES = ["Semua", "Astinet", "VPN IP", "Metro Ethernet", "SD-WAN", "Lainnya"]
  const stats = {
    total: services.length,
    active: services.filter(s => s.status === "Aktif").length,
    avgPrice: services.length ? Math.round(services.reduce((a, s) => a + s.priceMonthly, 0) / services.length) : 0,
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Layanan", value: stats.total, color: "text-blue-400" }, { label: "Layanan Aktif", value: stats.active, color: "text-emerald-400" }, { label: "Avg Harga/Bulan", value: formatIDR(stats.avgPrice), color: "text-violet-400" }].map(s => (
          <div key={s.label} className="card-glass rounded-xl px-5 py-4"><p className="text-xs text-slate-500">{s.label}</p><p className={cn("text-xl font-bold mt-0.5", s.color)}>{s.value}</p></div>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari layanan..." className="form-input pl-9 py-2" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700/50">
          {SERVICE_TYPES.map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-all", filterType === t ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50")}>{t}</button>
          ))}
        </div>
        <button onClick={() => setModal({ open: true, mode: "add" })} className="btn-primary flex items-center gap-2" id="btn-add-service"><Plus size={15} />Tambah Layanan</button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4"><Wifi size={28} className="text-slate-600" /></div>
          <p className="text-sm font-semibold text-slate-400">Tidak ada layanan ditemukan</p>
          <p className="text-xs text-slate-600 mt-1">Coba ubah filter atau tambah layanan baru</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(svc => <ServiceCard key={svc.id} item={svc} onEdit={() => setModal({ open: true, mode: "edit", editId: svc.id })} onDelete={() => setDeleteConfirm(svc.id)} />)}
        </div>
      )}
      {modal?.open && <ServiceModal mode={modal.mode} initial={modal.mode === "edit" && modal.editId ? getEditInitial(modal.editId) : blankForm()} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center"><Trash2 size={18} className="text-red-400" /></div>
              <div><h4 className="text-sm font-bold text-white">Hapus Layanan</h4><p className="text-xs text-slate-400 mt-0.5">Aksi ini tidak bisa dibatalkan</p></div>
            </div>
            <p className="text-sm text-slate-300 mb-5">Apakah Anda yakin ingin menghapus layanan <strong className="text-white">{services.find(s => s.id === deleteConfirm)?.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
