import React, { useState, useEffect, useCallback } from "react"
import { Building2, Plus, Search, Edit3, Trash2, X, Check, AlertCircle, ChevronDown, Phone, Mail, MapPin, User, DollarSign } from "lucide-react"
import { cn } from "../lib/utils"
import { CustomersDB } from "../lib/db"
import type { Customer } from "../lib/db"

const SEED_CUSTOMERS = [
  { name: "Pemkot Semarang", agencyType: "Pemerintah Kota", region: "Semarang", address: "Jl. Pemuda No.148, Semarang", picName: "Agus Widodo", picPhone: "0812-1234-5678", picEmail: "agus.widodo@semarangkota.go.id", npwp: "00.123.456.7-501.000", activeServices: [], totalContract: 2520000000, status: "Aktif", notes: "Pelanggan lama sejak 2019. Loyal dan pembayaran lancar." },
  { name: "Pemkab Kendal", agencyType: "Pemerintah Kabupaten", region: "Kendal", address: "Jl. Soekarno-Hatta No.191, Kendal", picName: "Retno Wulandari", picPhone: "0822-9876-5432", picEmail: "retno.w@kendalkab.go.id", npwp: "00.234.567.8-502.000", activeServices: [], totalContract: 890000000, status: "Aktif", notes: "Sedang dalam proses perpanjangan kontrak VPN MPLS." },
  { name: "Polda Jateng", agencyType: "Kepolisian Daerah", region: "Semarang", address: "Jl. Pahlawan No.1, Semarang", picName: "Kombes Hartono", picPhone: "0813-5555-6666", picEmail: "tik@poldajateng.go.id", npwp: "00.345.678.9-501.000", activeServices: [], totalContract: 3200000000, status: "Prospek", notes: "Proses negosiasi Google Workspace. Kompetitor: Indosat." },
  { name: "Pemkot Salatiga", agencyType: "Pemerintah Kota", region: "Salatiga", address: "Jl. Sukowati No.51, Salatiga", picName: "Drs. Bambang Eko", picPhone: "0811-2233-4455", picEmail: "diskominfo@salatiagkota.go.id", npwp: "00.456.789.0-503.000", activeServices: [], totalContract: 450000000, status: "Aktif", notes: "Metro Ethernet sudah terpasang, puas dengan layanan." },
]

function formatIDR(n) {
  if (!n || n === 0) return "-"
  if (n >= 1000000000) return `Rp ${(n / 1000000000).toFixed(1)}M`
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(0)} jt`
  return `Rp ${n.toLocaleString("id-ID")}`
}

const AGENCY_TYPES = ["Pemerintah Kota", "Pemerintah Kabupaten", "Kepolisian Daerah", "Legislatif", "TNI", "BUMN", "Lainnya"]
const STATUS_COLORS = {
  "Aktif": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Prospek": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Tidak Aktif": "bg-slate-700 text-slate-500 border-slate-600",
}
const REGIONS = ["Semarang", "Kendal", "Salatiga", "Magelang", "Blora", "Grobogan", "Kebumen", "Purworejo", "Lainnya"]

function blankForm() {
  return { name: "", agencyType: "Pemerintah Kota", region: "Semarang", address: "", picName: "", picPhone: "", picEmail: "", npwp: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "" }
}

function CustomerModal({ mode, initial, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = "Nama instansi wajib diisi"
    if (!form.picName.trim()) e.picName = "Nama PIC wajib diisi"
    if (!form.picPhone.trim()) e.picPhone = "Nomor telepon wajib diisi"
    if (!form.address.trim()) e.address = "Alamat wajib diisi"
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const handleSubmit = (e) => { e.preventDefault(); if (!validate()) return; onSave(form) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"><Building2 size={16} className="text-emerald-400" /></div>
            <h3 className="text-base font-bold text-white">{mode === "add" ? "Tambah Instansi Baru" : "Edit Data Instansi"}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Instansi *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Contoh: Pemkot Semarang" className={cn("form-input", errors.name && "border-red-500/60")} />
            {errors.name && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Jenis Instansi</label>
              <div className="relative">
                <select value={form.agencyType} onChange={e => set("agencyType", e.target.value)} className="form-input appearance-none pr-8">
                  {AGENCY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Wilayah/Region</label>
              <div className="relative">
                <select value={form.region} onChange={e => set("region", e.target.value)} className="form-input appearance-none pr-8">
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Alamat *</label>
            <textarea value={form.address} onChange={e => set("address", e.target.value)} rows={2} placeholder="Alamat lengkap instansi..." className={cn("form-input resize-none", errors.address && "border-red-500/60")} />
            {errors.address && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.address}</p>}
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data PIC (Person In Charge)</p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama PIC *</label>
              <input value={form.picName} onChange={e => set("picName", e.target.value)} placeholder="Nama lengkap PIC" className={cn("form-input", errors.picName && "border-red-500/60")} />
              {errors.picName && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.picName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">No. Telepon *</label>
                <input value={form.picPhone} onChange={e => set("picPhone", e.target.value)} placeholder="0812-xxxx-xxxx" className={cn("form-input", errors.picPhone && "border-red-500/60")} />
                {errors.picPhone && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.picPhone}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
                <input type="email" value={form.picEmail} onChange={e => set("picEmail", e.target.value)} placeholder="email@instansi.go.id" className="form-input" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">NPWP</label>
              <input value={form.npwp ?? ""} onChange={e => set("npwp", e.target.value)} placeholder="00.000.000.0-000.000" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Total Kontrak (Rp)</label>
              <input type="number" value={form.totalContract || ""} onChange={e => set("totalContract", Number(e.target.value))} placeholder="0" className="form-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
            <div className="flex gap-3">
              {["Aktif", "Prospek", "Tidak Aktif"].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => set("status", s)} className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer", form.status === s ? "border-blue-500 bg-blue-500" : "border-slate-600")}>
                    {form.status === s && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-slate-300">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Catatan</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Catatan internal tentang instansi ini..." className="form-input resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"><Check size={15} />{mode === "add" ? "Simpan Instansi" : "Update Instansi"}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CustomerRow({ item, onEdit, onDelete }) {
  return (
    <tr className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{item.name}</p>
            <p className="text-xs text-slate-500">{item.agencyType}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400"><MapPin size={11} />{item.region}</div>
      </td>
      <td className="px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300"><User size={11} className="text-slate-500" />{item.picName}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5"><Phone size={11} />{item.picPhone}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-emerald-400">{formatIDR(item.totalContract)}</span>
      </td>
      <td className="px-4 py-3">
        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", STATUS_COLORS[item.status] ?? STATUS_COLORS["Tidak Aktif"])}>{item.status}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"><Edit3 size={13} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  )
}

export function CustomerDatabase() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("Semua")
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const load = useCallback(() => setCustomers(CustomersDB.getAll()), [])
  useEffect(() => { CustomersDB.seed(SEED_CUSTOMERS); load() }, [load])
  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.picName.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "Semua" || c.status === filterStatus
    return matchSearch && matchStatus
  })
  const handleSave = (data) => {
    if (modal?.mode === "add") CustomersDB.create(data)
    else if (modal?.editId) CustomersDB.update(modal.editId, data)
    load(); setModal(null)
  }
  const handleDelete = (id) => { CustomersDB.delete(id); load(); setDeleteConfirm(null) }
  const getEditInitial = (id) => {
    const c = CustomersDB.getById(id)
    if (!c) return blankForm()
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = c
    return rest
  }
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === "Aktif").length,
    prospek: customers.filter(c => c.status === "Prospek").length,
    totalContract: customers.reduce((a, c) => a + c.totalContract, 0),
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Instansi", value: stats.total, color: "text-blue-400", icon: Building2 },
          { label: "Pelanggan Aktif", value: stats.active, color: "text-emerald-400", icon: Check },
          { label: "Prospek", value: stats.prospek, color: "text-amber-400", icon: User },
          { label: "Total Nilai Kontrak", value: formatIDR(stats.totalContract), color: "text-violet-400", icon: DollarSign },
        ].map(s => (
          <div key={s.label} className="card-glass rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0"><s.icon size={16} className={s.color} /></div>
            <div><p className="text-xs text-slate-500">{s.label}</p><p className={cn("text-lg font-bold mt-0.5", s.color)}>{s.value}</p></div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari instansi, PIC, atau wilayah..." className="form-input pl-9 py-2" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700/50">
          {["Semua", "Aktif", "Prospek", "Tidak Aktif"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-all", filterStatus === s ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50")}>{s}</button>
          ))}
        </div>
        <button onClick={() => setModal({ open: true, mode: "add" })} className="btn-primary flex items-center gap-2" id="btn-add-customer"><Plus size={15} />Tambah Instansi</button>
      </div>
      <div className="card-glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Instansi</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Wilayah</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">PIC</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kontrak</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center"><p className="text-sm text-slate-500">Tidak ada data instansi</p><p className="text-xs text-slate-600 mt-1">Tambah instansi baru untuk memulai</p></td></tr>
            ) : (
              filtered.map(c => <CustomerRow key={c.id} item={c} onEdit={() => setModal({ open: true, mode: "edit", editId: c.id })} onDelete={() => setDeleteConfirm(c.id)} />)
            )}
          </tbody>
        </table>
      </div>
      {modal?.open && <CustomerModal mode={modal.mode} initial={modal.mode === "edit" && modal.editId ? getEditInitial(modal.editId) : blankForm()} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center"><Trash2 size={18} className="text-red-400" /></div>
              <div><h4 className="text-sm font-bold text-white">Hapus Instansi</h4><p className="text-xs text-slate-400 mt-0.5">Aksi ini tidak bisa dibatalkan</p></div>
            </div>
            <p className="text-sm text-slate-300 mb-5">Apakah Anda yakin ingin menghapus data <strong className="text-white">{customers.find(c => c.id === deleteConfirm)?.name}</strong>?</p>
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
