import React, { useState, useEffect, useCallback } from "react"
import { FolderPlus, Plus, Search, Edit3, Trash2, X, Check, AlertCircle, ChevronDown, Activity, Calendar, DollarSign, User, Building2 } from "lucide-react"
import { cn } from "../lib/utils"
import { ProjectsDB } from "../lib/db"
import type { ProjectEntry } from "../lib/db"
import { PROJECTS as STATIC_PROJECTS } from "../data/mockData"

const STAGE_COLORS: Record<string, string> = { F0: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", F1: "bg-amber-500/20 text-amber-400 border-amber-500/30", F2: "bg-blue-500/20 text-blue-400 border-blue-500/30", F3: "bg-violet-500/20 text-violet-400 border-violet-500/30", WIN: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", LOSS: "bg-red-500/20 text-red-400 border-red-500/30" }
const STATUS_COLORS: Record<string, string> = { Active: "bg-blue-500/20 text-blue-400 border-blue-500/30", "At Risk": "bg-red-500/20 text-red-400 border-red-500/30", Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", Lost: "bg-slate-700 text-slate-500 border-slate-600" }

function formatIDR(n: number) {
  if (!n || n === 0) return "Rp 0"
  if (n >= 1000000000) return `Rp ${(n / 1000000000).toFixed(2)}M`
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(0)} jt`
  return `Rp ${n.toLocaleString("id-ID")}`
}

const AGENCY_TYPES = ["Pemerintah Kota", "Pemerintah Kabupaten", "Kepolisian Daerah", "Legislatif", "TNI", "BUMN", "Lainnya"]
const REGIONS = ["Semarang", "Kendal", "Salatiga", "Magelang", "Blora", "Grobogan", "Kebumen", "Purworejo", "Lainnya"]
const SERVICE_TYPES = ["Astinet", "VPN IP", "Metro Ethernet", "SD-WAN", "Google Workspace", "Mikrotik", "CPE", "Lainnya"]

function blankForm(): Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'> {
  return { idLOP: "", projectName: "", agency: "", agencyType: "Pemerintah Kota", region: "Semarang", budget: 0, procurementMethod: "Tender/e-Katalog", stage: "F0", progress: 0, startDate: "", endDate: "", pic: "", category: "On Channel", serviceType: "Astinet", status: "Active", notes: "" }
}

interface ModalProps {
  mode: 'add' | 'edit';
  initial: Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'>;
  onSave: (data: Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

function ProjectModal({ mode, initial, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))
  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.projectName.trim()) e.projectName = "Nama proyek wajib diisi"
    if (!form.agency.trim()) e.agency = "Nama instansi wajib diisi"
    if (form.budget <= 0) e.budget = "Anggaran harus lebih dari 0"
    if (!form.pic.trim()) e.pic = "PIC wajib diisi"
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!validate()) return; onSave(form) }
  const stageProgressMap: Record<string, number> = { F0: 5, F1: 25, F2: 50, F3: 75, WIN: 100, LOSS: 0 }
  const handleStageChange = (stage: string) => { set("stage", stage as any); set("progress", stageProgressMap[stage] ?? form.progress) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"><FolderPlus size={16} className="text-violet-400" /></div>
            <h3 className="text-base font-bold text-white">{mode === "add" ? "Input Proyek Baru" : "Edit Proyek"}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">ID LOP</label>
              <input value={form.idLOP} onChange={e => set("idLOP", e.target.value)} placeholder="LOP-2024-SMG-001" className="form-input" />
            </div>
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
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Proyek *</label>
            <input value={form.projectName} onChange={e => set("projectName", e.target.value)} placeholder="Contoh: Pengadaan Layanan Internet Dedicated Pemkot Semarang" className={cn("form-input", errors.projectName && "border-red-500/60")} />
            {errors.projectName && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.projectName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Instansi *</label>
              <input value={form.agency} onChange={e => set("agency", e.target.value)} placeholder="Pemkot Semarang" className={cn("form-input", errors.agency && "border-red-500/60")} />
              {errors.agency && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.agency}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Jenis Instansi</label>
              <div className="relative">
                <select value={form.agencyType} onChange={e => set("agencyType", e.target.value)} className="form-input appearance-none pr-8">
                  {AGENCY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Wilayah</label>
              <div className="relative">
                <select value={form.region} onChange={e => set("region", e.target.value)} className="form-input appearance-none pr-8">
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tipe Layanan</label>
              <div className="relative">
                <select value={form.serviceType} onChange={e => set("serviceType", e.target.value)} className="form-input appearance-none pr-8">
                  {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pagu Anggaran (Rp) *</label>
              <input type="number" value={form.budget || ""} onChange={e => set("budget", Number(e.target.value))} placeholder="0" className={cn("form-input", errors.budget && "border-red-500/60")} />
              {errors.budget && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.budget}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Metode Pengadaan</label>
              <div className="relative">
                <select value={form.procurementMethod} onChange={e => set("procurementMethod", e.target.value)} className="form-input appearance-none pr-8">
                  <option>Tender/e-Katalog</option>
                  <option>Penunjukan Langsung</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Stage Pipeline</label>
            <div className="flex gap-2 flex-wrap">
              {["F0", "F1", "F2", "F3", "WIN", "LOSS"].map(s => (
                <button key={s} type="button" onClick={() => handleStageChange(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", form.stage === s ? STAGE_COLORS[s] : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300")}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Progress ({form.progress}%)</label>
            <input type="range" min={0} max={100} value={form.progress} onChange={e => set("progress", Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-full appearance-none accent-blue-500" />
            <div className="flex justify-between text-xs text-slate-600 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal Mulai</label>
              <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal Selesai</label>
              <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">PIC (Account Manager) *</label>
              <input value={form.pic} onChange={e => set("pic", e.target.value)} placeholder="Nama AM" className={cn("form-input", errors.pic && "border-red-500/60")} />
              {errors.pic && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.pic}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
              <div className="relative">
                <select value={form.status} onChange={e => set("status", e.target.value)} className="form-input appearance-none pr-8">
                  <option value="Active">Active</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Completed">Completed</option>
                  <option value="Lost">Lost</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Catatan</label>
            <textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Catatan proyek..." className="form-input resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"><Check size={15} />{mode === "add" ? "Simpan Proyek" : "Update Proyek"}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectRow({ item, onEdit, onDelete }: { item: ProjectEntry; onEdit: () => void; onDelete: () => void }) {
  return (
    <tr className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors group">
      <td className="px-4 py-3">
        <div>
          <p className="text-xs font-mono text-slate-500">{item.idLOP || item.id}</p>
          <p className="text-sm font-semibold text-white max-w-xs truncate mt-0.5">{item.projectName}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5"><Building2 size={11} className="text-slate-500" /><span className="text-xs text-slate-300">{item.agency}</span></div>
        <p className="text-xs text-slate-500 mt-0.5">{item.region}</p>
      </td>
      <td className="px-4 py-3"><span className="text-sm font-semibold text-emerald-400">{formatIDR(item.budget)}</span></td>
      <td className="px-4 py-3">
        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", STAGE_COLORS[item.stage] ?? "bg-slate-700 text-slate-500 border-slate-600")}>{item.stage}</span>
      </td>
      <td className="px-4 py-3">
        <div className="w-24">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>{item.progress}%</span></div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", STATUS_COLORS[item.status] ?? "bg-slate-700 text-slate-500 border-slate-600")}>{item.status}</span>
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

export function ProjectDatabase() {
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [search, setSearch] = useState("")
  const [filterStage, setFilterStage] = useState("Semua")
  const [filterCat, setFilterCat] = useState("Semua")
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; editId?: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const load = useCallback(() => setProjects(ProjectsDB.getAll()), [])
  useEffect(() => {
    ProjectsDB.seed(STATIC_PROJECTS.map(p => ({ ...p, notes: "" })) as any)
    load()
  }, [load])
  const filtered = projects.filter(p => {
    const matchSearch = p.projectName.toLowerCase().includes(search.toLowerCase()) || p.agency.toLowerCase().includes(search.toLowerCase())
    const matchStage = filterStage === "Semua" || p.stage === filterStage
    const matchCat = filterCat === "Semua" || p.category === filterCat
    return matchSearch && matchStage && matchCat
  })
  const handleSave = (data: Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (modal?.mode === "add") ProjectsDB.create(data)
    else if (modal?.editId) ProjectsDB.update(modal.editId, data)
    load(); setModal(null)
  }
  const handleDelete = (id: string) => { ProjectsDB.delete(id); load(); setDeleteConfirm(null) }
  const getEditInitial = (id: string): Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'> => {
    const p = ProjectsDB.getById(id)
    if (!p) return blankForm()
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = p
    return rest
  }
  const totalBudget = filtered.reduce((a, p) => a + p.budget, 0)
  const wins = filtered.filter(p => p.stage === "WIN").length
  const atRisk = filtered.filter(p => p.status === "At Risk").length
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Proyek", value: filtered.length, color: "text-blue-400" },
          { label: "Total Anggaran", value: formatIDR(totalBudget), color: "text-emerald-400" },
          { label: "WIN", value: wins, color: "text-violet-400" },
          { label: "At Risk", value: atRisk, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="card-glass rounded-xl px-5 py-4"><p className="text-xs text-slate-500">{s.label}</p><p className={cn("text-xl font-bold mt-0.5", s.color)}>{s.value}</p></div>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari proyek atau instansi..." className="form-input pl-9 py-2" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700/50">
          {["Semua", "F0", "F1", "F2", "F3", "WIN", "LOSS"].map(s => (
            <button key={s} onClick={() => setFilterStage(s)} className={cn("text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all", filterStage === s ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50")}>{s}</button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700/50">
          {["Semua", "On Channel", "GTMA"].map(c => (
            <button key={c} onClick={() => setFilterCat(c)} className={cn("text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all", filterCat === c ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50")}>{c}</button>
          ))}
        </div>
        <button onClick={() => setModal({ open: true, mode: "add" })} className="btn-primary flex items-center gap-2" id="btn-add-project"><Plus size={15} />Input Proyek</button>
      </div>
      <div className="card-glass rounded-2xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Proyek</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Instansi</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Anggaran</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center"><p className="text-sm text-slate-500">Tidak ada proyek ditemukan</p></td></tr>
            ) : (
              filtered.map(p => <ProjectRow key={p.id} item={p} onEdit={() => setModal({ open: true, mode: "edit", editId: p.id })} onDelete={() => setDeleteConfirm(p.id)} />)
            )}
          </tbody>
        </table>
      </div>
      {modal?.open && <ProjectModal mode={modal.mode} initial={modal.mode === "edit" && modal.editId ? getEditInitial(modal.editId) : blankForm()} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center"><Trash2 size={18} className="text-red-400" /></div>
              <div><h4 className="text-sm font-bold text-white">Hapus Proyek</h4><p className="text-xs text-slate-400 mt-0.5">Aksi ini tidak bisa dibatalkan</p></div>
            </div>
            <p className="text-sm text-slate-300 mb-5">Hapus proyek <strong className="text-white">{projects.find(p => p.id === deleteConfirm)?.projectName}</strong>?</p>
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
