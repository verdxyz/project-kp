import React, { useState, useEffect, useCallback } from "react"
import { Building2, Plus, Edit3, Trash2, X, Check, AlertCircle, ChevronDown, Phone, Mail, MapPin, User, DollarSign } from "lucide-react"
import { cn } from "../lib/utils"
import { CustomersDB } from "../lib/db"
import type { Customer } from "../lib/db"

const SEED_CUSTOMERS: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: "Pemkot Semarang", agencyType: "Pemerintah Kota", region: "Semarang", address: "Jl. Pemuda No.148, Semarang", picName: "", picPhone: "", picEmail: "", npwp: "00.123.456.7-501.000", activeServices: [], totalContract: 0, status: "Aktif", notes: "Pelanggan lama sejak 2019. Loyal dan pembayaran lancar." },
  { name: "Pemkab Kendal", agencyType: "Pemerintah Kabupaten", region: "Kendal", address: "Jl. Soekarno-Hatta No.191, Kendal", picName: "", picPhone: "", picEmail: "", npwp: "00.234.567.8-502.000", activeServices: [], totalContract: 0, status: "Aktif", notes: "Sedang dalam proses perpanjangan kontrak VPN MPLS." },
  { name: "Pemkab Demak", agencyType: "Pemerintah Kabupaten", region: "Demak", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
  { name: "Pemkot Salatiga", agencyType: "Pemerintah Kota", region: "Salatiga", address: "Jl. Sukowati No.51, Salatiga", picName: "", picPhone: "", picEmail: "", npwp: "00.456.789.0-503.000", activeServices: [], totalContract: 0, status: "Aktif", notes: "Metro Ethernet sudah terpasang, puas dengan layanan." },
  { name: "Pemkab Semarang", agencyType: "Pemerintah Kabupaten", region: "Semarang", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
  { name: "Pemkab Batang", agencyType: "Pemerintah Kabupaten", region: "Batang", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
  { name: "Pemkab Pekalongan", agencyType: "Pemerintah Kabupaten", region: "Pekalongan", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
  { name: "Pemkot Pekalongan", agencyType: "Pemerintah Kota", region: "Pekalongan", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
  { name: "Pemkab Pemalang", agencyType: "Pemerintah Kabupaten", region: "Pemalang", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
  { name: "Pemkot Tegal", agencyType: "Pemerintah Kota", region: "Tegal", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
  { name: "Pemkab Tegal", agencyType: "Pemerintah Kabupaten", region: "Tegal", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
  { name: "Pemkab Brebes", agencyType: "Pemerintah Kabupaten", region: "Brebes", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
  { name: "Provinsi Jawa Tengah", agencyType: "Pemerintah Provinsi", region: "Semarang", address: "", picName: "", picPhone: "", picEmail: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "Nama PIC contoh; ganti dengan data resmi." },
]

function formatIDR(n: number) {
  if (!n || n === 0) return "Rp 0"
  if (n >= 1000000000) return `Rp ${(n / 1000000000).toFixed(1).replace('.0', '')} M`
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(0)} Jt`
  return `Rp ${n.toLocaleString("id-ID")}`
}

const AGENCY_TYPES = ["Pemerintah Kota", "Pemerintah Kabupaten", "Pemerintah Provinsi", "Kepolisian Daerah", "Legislatif", "TNI", "BUMN", "Lainnya"]
const STATUS_COLORS: Record<string, string> = {
  "Aktif": "bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]",
  "Prospek": "bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]",
  "Tidak Aktif": "bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]",
}
const REGIONS = ["Semarang", "Kendal", "Salatiga", "Magelang", "Blora", "Grobogan", "Kebumen", "Purworejo", "Lainnya"]

function blankForm(): Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> {
  return { name: "", agencyType: "Pemerintah Kota" as any, region: "Semarang", address: "", picName: "", picPhone: "", picEmail: "", npwp: "", activeServices: [], totalContract: 0, status: "Prospek", notes: "" }
}

interface ModalProps {
  mode: 'add' | 'edit';
  initial: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
  onSave: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

function CustomerModal({ mode, initial, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))
  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Nama instansi wajib diisi"
    if (!form.address.trim()) e.address = "Alamat wajib diisi"
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!validate()) return; onSave(form) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 " onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#F9F8F6] border border-[#E5E5E5] rounded-2xl  ">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-[#F9F8F6]  z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F3F3F1] border border-[#E5E5E5] flex items-center justify-center"><Building2 size={16} className="text-[#666666]" /></div>
            <h3 className="text-base font-bold text-[#1C1C1E]">{mode === "add" ? "Tambah Instansi Baru" : "Edit Data Instansi"}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FFFFFF] text-[#666666] hover:text-[#1C1C1E] transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1.5">Nama Instansi *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Contoh: Pemkot Semarang" className={cn("form-input", errors.name && "border-[#E5E5E5]")} />
            {errors.name && <p className="text-xs text-[#666666] mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">Jenis Instansi</label>
              <div className="relative">
                <select value={form.agencyType} onChange={e => set("agencyType", e.target.value)} className="form-input appearance-none pr-8">
                  {AGENCY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">Wilayah/Region</label>
              <div className="relative">
                <select value={form.region} onChange={e => set("region", e.target.value)} className="form-input appearance-none pr-8">
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1.5">Alamat *</label>
            <textarea value={form.address} onChange={e => set("address", e.target.value)} rows={2} placeholder="Alamat lengkap instansi..." className={cn("form-input resize-none", errors.address && "border-[#E5E5E5]")} />
            {errors.address && <p className="text-xs text-[#666666] mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.address}</p>}
          </div>
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5] space-y-4">
            <p className="text-xs font-bold text-[#666666] uppercase tracking-wider">Data PIC (Person In Charge)</p>
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">Nama PIC</label>
              <input value={form.picName} onChange={e => set("picName", e.target.value)} placeholder="Nama lengkap PIC" className={cn("form-input", errors.picName && "border-[#E5E5E5]")} />
              {errors.picName && <p className="text-xs text-[#666666] mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.picName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#666666] mb-1.5">No. Telepon</label>
                <input value={form.picPhone} onChange={e => set("picPhone", e.target.value)} placeholder="0812-xxxx-xxxx" className={cn("form-input", errors.picPhone && "border-[#E5E5E5]")} />
                {errors.picPhone && <p className="text-xs text-[#666666] mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.picPhone}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#666666] mb-1.5">Email</label>
                <input type="email" value={form.picEmail} onChange={e => set("picEmail", e.target.value)} placeholder="email@instansi.go.id" className="form-input" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">NPWP</label>
              <input value={form.npwp ?? ""} onChange={e => set("npwp", e.target.value)} placeholder="00.000.000.0-000.000" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">Total Kontrak (Rp)</label>
              <input type="number" value={form.totalContract || ""} onChange={e => set("totalContract", Number(e.target.value))} placeholder="0" className="form-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1.5">Status</label>
            <div className="flex gap-3">
              {["Aktif", "Prospek", "Tidak Aktif"].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => set("status", s)} className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer", form.status === s ? "border-[#E5E5E5] bg-[#F3F3F1]" : "border-[#E5E5E5]")}>
                    {form.status === s && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-[#666666]">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1.5">Catatan</label>
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

function CustomerRow({ item, onEdit, onDelete, onOpenProfile }: { item: Customer; onEdit: () => void; onDelete: () => void; onOpenProfile?: (name: string) => void }) {
  return (
    <tr
      tabIndex={onOpenProfile ? 0 : undefined}
      aria-label={onOpenProfile ? `Buka profil ${item.name}` : undefined}
      onClick={onOpenProfile ? () => onOpenProfile(item.name) : undefined}
      onKeyDown={onOpenProfile ? (event) => {
        if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return
        event.preventDefault()
        onOpenProfile(item.name)
      } : undefined}
      className={`border-b border-[#E5E5E5] transition-colors group ${onOpenProfile ? 'cursor-pointer hover:bg-[#F3F3F1] focus:bg-[#F3F3F1] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#E5E5E5]' : 'hover:bg-[#FFFFFF]'}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F3F3F1] border border-[#E5E5E5] flex items-center justify-center flex-shrink-0">
            <Building2 size={14} className="text-[#666666]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1C1C1E]">{item.name}</p>
            <p className="text-xs text-[#666666]">{item.agencyType}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-[#666666]"><MapPin size={11} />{item.region}</div>
      </td>
      <td className="px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#666666]"><User size={11} className="text-[#666666]" />{item.picName}</div>
          <div className="flex items-center gap-1.5 text-xs text-[#666666] mt-0.5"><Phone size={11} />{item.picPhone}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-[#666666]">{formatIDR(item.totalContract)}</span>
      </td>
      <td className="px-4 py-3">
        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", STATUS_COLORS[item.status] ?? STATUS_COLORS["Tidak Aktif"])}>{item.status}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" onClick={(event) => event.stopPropagation()}>
          <button onClick={onEdit} aria-label={`Edit ${item.name}`} className="p-1.5 rounded-lg bg-[#F3F3F1] hover:bg-[#F3F3F1] text-[#666666] hover:text-[#666666] transition-colors"><Edit3 size={13} /></button>
          <button onClick={onDelete} aria-label={`Hapus ${item.name}`} className="p-1.5 rounded-lg bg-[#F3F3F1] hover:bg-[#F3F3F1] text-[#666666] hover:text-[#666666] transition-colors"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  )
}

export function CustomerDatabase({ onOpenProfile }: { onOpenProfile?: (name: string) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("Semua")
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; editId?: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const load = useCallback(() => setCustomers(CustomersDB.getAll()), [])
  useEffect(() => { CustomersDB.clearInitialProfileData(); CustomersDB.seed(SEED_CUSTOMERS); load() }, [load])
  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.picName.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "Semua" || c.status === filterStatus
    return matchSearch && matchStatus
  })
  const handleSave = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (modal?.mode === "add") CustomersDB.create(data)
    else if (modal?.editId) CustomersDB.update(modal.editId, data)
    load(); setModal(null)
  }
  const handleDelete = (id: string) => { CustomersDB.delete(id); load(); setDeleteConfirm(null) }
  const getEditInitial = (id: string): Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> => {
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
          { label: "Total Instansi", value: stats.total, color: "text-[#666666]", icon: Building2 },
          { label: "Pelanggan Aktif", value: stats.active, color: "text-[#666666]", icon: Check },
          { label: "Prospek", value: stats.prospek, color: "text-[#666666]", icon: User },
          { label: "Total Nilai Kontrak", value: formatIDR(stats.totalContract), color: "text-[#666666]", icon: DollarSign },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E5E5E5] rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center flex-shrink-0"><s.icon size={16} className={s.color} /></div>
            <div><p className="text-xs text-[#666666]">{s.label}</p><p className={cn("text-lg font-bold mt-0.5", s.color)}>{s.value}</p></div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari instansi, PIC, atau wilayah..." className="form-input py-2" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5]">
          {["Semua", "Aktif", "Prospek", "Tidak Aktif"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-all", filterStatus === s ? "bg-black text-[#1C1C1E]" : "text-[#666666] hover:text-[#666666] hover:bg-[#F3F3F1]")}>{s}</button>
          ))}
        </div>
        <button onClick={() => setModal({ open: true, mode: "add" })} className="btn-primary flex items-center gap-2" id="btn-add-customer"><Plus size={15} />Tambah Instansi</button>
      </div>
      <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E5E5]">
              <th className="px-4 py-3 text-left text-xs font-bold text-[#666666] uppercase tracking-wider">Instansi</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#666666] uppercase tracking-wider">Wilayah</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#666666] uppercase tracking-wider">PIC</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#666666] uppercase tracking-wider">Total Kontrak</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#666666] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#666666] uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center"><p className="text-sm text-[#666666]">Tidak ada data instansi</p><p className="text-xs text-[#666666] mt-1">Tambah instansi baru untuk memulai</p></td></tr>
            ) : (
              filtered.map(c => <CustomerRow key={c.id} item={c} onEdit={() => setModal({ open: true, mode: "edit", editId: c.id })} onDelete={() => setDeleteConfirm(c.id)} onOpenProfile={onOpenProfile} />)
            )}
          </tbody>
        </table>
      </div>
      {modal?.open && <CustomerModal mode={modal.mode} initial={modal.mode === "edit" && modal.editId ? getEditInitial(modal.editId) : blankForm()} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 " onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#F9F8F6] border border-[#E5E5E5] rounded-2xl p-6 max-w-sm w-full ">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F3F3F1] border border-[#E5E5E5] flex items-center justify-center"><Trash2 size={18} className="text-[#666666]" /></div>
              <div><h4 className="text-sm font-bold text-[#1C1C1E]">Hapus Instansi</h4><p className="text-xs text-[#666666] mt-0.5">Aksi ini tidak bisa dibatalkan</p></div>
            </div>
            <p className="text-sm text-[#666666] mb-5">Apakah Anda yakin ingin menghapus data <strong className="text-[#1C1C1E]">{customers.find(c => c.id === deleteConfirm)?.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2 rounded-xl bg-black hover:bg-[#F3F3F1] text-[#1C1C1E] text-sm font-semibold transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
