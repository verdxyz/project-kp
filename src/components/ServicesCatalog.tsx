import React, { useState, useEffect, useCallback } from "react"
import {
  Wifi,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Zap,
  Globe,
  Network,
  Shield,
  Layers,
  Building2,
  FileSpreadsheet,
  Save,
  RotateCcw,
  PhoneCall,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react"
import { cn } from "../lib/utils"
import { ProjectsDB, ServicesDB, type ProjectEntry, type ServiceItem } from "../lib/db"
import { ServicePoints, type ProjectServicePoint } from "../lib/servicePoints"
import { MASTER_INSTANSI, MASTER_DINAS, NGTMA_PRODUCTS } from "../lib/constants"

const SERVICE_TYPES = ["HSI", "WiFi", "Astinet", "IP Transit", "VPN", "Metro", "DDOS", "UHOS", "PIJAR", "NETMONK"]

const SEED_SERVICES = [
  { name: "Astinet Dedicated 100 Mbps", category: "On Channel", serviceType: "Astinet", bandwidth: "100 Mbps", sla: "99.5%", priceMonthly: 8500000, description: "Layanan internet dedicated enterprise berkecepatan tinggi dengan SLA terjamin", features: ["IP Publik Statis", "SLA 99.5%", "Monitoring 24/7", "Redundant Path"], status: "Aktif" },
  { name: "Astinet Dedicated 50 Mbps", category: "On Channel", serviceType: "Astinet", bandwidth: "50 Mbps", sla: "99.5%", priceMonthly: 4800000, description: "Layanan internet dedicated untuk instansi skala menengah", features: ["IP Publik Statis", "SLA 99.5%", "Monitoring 24/7"], status: "Aktif" },
  { name: "VPN IP MPLS Premium", category: "On Channel", serviceType: "VPN IP", bandwidth: "Fleksibel", sla: "99.9%", priceMonthly: 12000000, description: "Jaringan privat antar kantor dengan teknologi MPLS untuk keamanan data tinggi", features: ["MPLS Backbone", "QoS Priority", "SLA 99.9%", "Multi-site", "Traffic Engineering"], status: "Aktif" },
  { name: "Metro Ethernet 1 Gbps", category: "On Channel", serviceType: "Metro Ethernet", bandwidth: "1 Gbps", sla: "99.9%", priceMonthly: 18000000, description: "Koneksi fiber optik metro area dengan throughput sangat tinggi", features: ["Fiber Optik", "Full Duplex", "SLA 99.9%", "Low Latency < 5ms"], status: "Aktif" },
  { name: "SD-WAN Enterprise", category: "On Channel", serviceType: "SD-WAN", bandwidth: "Multi-link", sla: "99.8%", priceMonthly: 22000000, description: "Software-defined WAN untuk manajemen jaringan terpusat dan otomatis", features: ["Zero-touch Provisioning", "Centralized Dashboard", "Traffic Optimization", "Built-in Security"], status: "Aktif" },
]

const SERVICE_ICONS: Record<string, React.ElementType> = { "Astinet": Globe, "VPN IP": Shield, "Metro Ethernet": Network, "SD-WAN": Zap, "Lainnya": Wifi }
const SERVICE_COLORS: Record<string, string> = {
  "Astinet": "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
  "VPN IP": "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400",
  "Metro Ethernet": "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
  "SD-WAN": "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
  "Lainnya": "from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-400",
}

function formatIDR(n: number) {
  if (!n || n === 0) return "Rp 0"
  if (n >= 1000000000) return `Rp ${(n / 1000000000).toFixed(1).replace(".0", "")} M`
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1).replace(".0", "")} Jt`
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)} Rb`
  return `Rp ${n.toLocaleString("id-ID")}`
}

function blankForm(): Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'> {
  return { name: "", category: "On Channel", serviceType: "Astinet", bandwidth: "", sla: "99.5%", priceMonthly: 0, priceOTC: undefined, description: "", features: [""], status: "Aktif" }
}

interface ModalProps {
  mode: 'add' | 'edit';
  initial: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>;
  onSave: (data: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

function ServiceModal({ mode, initial, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))
  const setFeature = (idx: number, val: string) => { const next = [...form.features]; next[idx] = val; set("features", next) }
  const addFeature = () => set("features", [...form.features, ""])
  const removeFeature = (idx: number) => set("features", form.features.filter((_, i) => i !== idx))
  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Nama layanan wajib diisi"
    if (form.priceMonthly <= 0) e.priceMonthly = "Harga bulanan harus lebih dari 0"
    if (!form.description.trim()) e.description = "Deskripsi wajib diisi"
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!validate()) return; onSave({ ...form, features: form.features.filter(f => f.trim()) }) }
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
                  <option value="On Channel">Own Channel</option>
                  <option value="GTMA">GTMA</option>
                  <option value="NGTMA">NGTMA</option>
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
              <input type="number" step="0.01" value={form.priceOTC ?? ""} onChange={e => set("priceOTC", e.target.value ? Number(e.target.value) : undefined)} placeholder="Opsional" className="form-input" />
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

function ServiceCard({ item, onEdit, onDelete }: { item: ServiceItem; onEdit: () => void; onDelete: () => void }) {
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

interface ServicePointInputRow {
  id?: string
  serviceGroup: 'Non-POTS' | 'POTS'
  productType: string
  bandwidth: string
  capacityMbps: number
  location: string
  quote: string
  orderNo: string
  sid: string
  activeDate: string
}

function emptyServicePointRow(defaultProduct = 'HSI'): ServicePointInputRow {
  return {
    serviceGroup: 'Non-POTS',
    productType: defaultProduct,
    bandwidth: '100 Mbps',
    capacityMbps: 100,
    location: '',
    quote: '',
    orderNo: '',
    sid: '',
    activeDate: new Date().toISOString().slice(0, 10),
  }
}

interface ServicesCatalogProps {
  initialCategory?: string
}

export function ServicesCatalog({ initialCategory = "Semua" }: ServicesCatalogProps) {
  const [activeTab, setActiveTab] = useState<'service-points' | 'catalog'>('service-points')

  // Catalog State
  const [services, setServices] = useState<ServiceItem[]>([])
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("Semua")
  const [filterCategory, setFilterCategory] = useState(initialCategory)
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; editId?: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Service Points per ID LOP State (Revisi 1, 2, 4)
  const [projectsList, setProjectsList] = useState<ProjectEntry[]>([])
  const [selectedIdLOP, setSelectedIdLOP] = useState<string>("")
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [savingPoints, setSavingPoints] = useState(false)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("")
  const [pointsError, setPointsError] = useState("")

  // Form Fields
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null)
  const [ngtmaCustomer, setNgtmaCustomer] = useState("")
  const [ngtmaDinas, setNgtmaDinas] = useState("")
  const [ngtmaSubsidiary, setNgtmaSubsidiary] = useState("")
  const [serviceRows, setServiceRows] = useState<ServicePointInputRow[]>([emptyServicePointRow()])

  const loadCatalog = useCallback(() => setServices(ServicesDB.getAll()), [])

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true)
    try {
      const projects = await ProjectsDB.getAll()
      setProjectsList(projects)
      if (projects.length > 0 && !selectedIdLOP) {
        setSelectedIdLOP(projects[0].idLOP)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingProjects(false)
    }
  }, [selectedIdLOP])

  useEffect(() => {
    ServicesDB.seed(SEED_SERVICES as any)
    loadCatalog()
    void loadProjects()
  }, [loadCatalog, loadProjects])

  useEffect(() => {
    setFilterCategory(initialCategory)
  }, [initialCategory])

  // When selectedIdLOP changes, load project details and existing service points
  useEffect(() => {
    if (!selectedIdLOP) {
      setSelectedProject(null)
      return
    }

    const proj = projectsList.find((p) => p.idLOP === selectedIdLOP)
    if (proj) {
      setSelectedProject(proj)
      setNgtmaCustomer(proj.customerName || proj.agency || "")
      setNgtmaDinas(proj.dinasName || "")
      setNgtmaSubsidiary(proj.subsidiaryName || "")
    }

    let active = true
    setLoadingPoints(true)
    setSaveSuccessMessage("")
    setPointsError("")

    ServicePoints.list(selectedIdLOP)
      .then((points) => {
        if (!active) return
        if (points && points.length > 0) {
          const mapped: ServicePointInputRow[] = points.map((pt) => ({
            id: pt.id,
            serviceGroup: pt.serviceGroup || (pt.productType?.toUpperCase() === 'POTS' ? 'POTS' : 'Non-POTS'),
            productType: pt.productType || 'HSI',
            bandwidth: pt.bandwidth || (pt.capacityMbps ? `${pt.capacityMbps} Mbps` : ''),
            capacityMbps: pt.capacityMbps || 0,
            location: pt.location || '',
            quote: pt.quote || '',
            orderNo: pt.orderNo || '',
            sid: pt.sid || '',
            activeDate: pt.activeDate || '',
          }))
          setServiceRows(mapped)
        } else {
          // Initialize with 1 default row derived from project
          setServiceRows([
            {
              serviceGroup: proj?.serviceType?.toLowerCase() === 'pots' ? 'POTS' : 'Non-POTS',
              productType: proj?.serviceType || 'HSI',
              bandwidth: proj?.totalCapacityMbps ? `${proj.totalCapacityMbps} Mbps` : '100 Mbps',
              capacityMbps: proj?.totalCapacityMbps || 100,
              location: proj?.region ? `Kota/Kabupaten ${proj.region}` : '',
              quote: '',
              orderNo: '',
              sid: proj?.sid || '',
              activeDate: proj?.startDate || new Date().toISOString().slice(0, 10),
            },
          ])
        }
      })
      .catch((err) => {
        if (!active) return
        setPointsError(err instanceof Error ? err.message : 'Gagal memuat titik layanan')
      })
      .finally(() => {
        if (active) setLoadingPoints(false)
      })

    return () => { active = false }
  }, [selectedIdLOP, projectsList])

  // Service Row Actions (Revisi 2: Multiple Input)
  const handleAddRow = () => {
    setServiceRows((prev) => [...prev, emptyServicePointRow(selectedProject?.serviceType || 'HSI')])
  }

  const handleRemoveRow = (index: number) => {
    if (serviceRows.length <= 1) {
      // Just clear the row
      setServiceRows([emptyServicePointRow()])
      return
    }
    setServiceRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRowChange = (index: number, field: keyof ServicePointInputRow, value: any) => {
    setServiceRows((prev) => {
      const next = [...prev]
      const updated = { ...next[index], [field]: value }
      if (field === 'serviceGroup') {
        if (value === 'POTS') {
          updated.productType = 'HSI'
          updated.capacityMbps = 0
          updated.bandwidth = ''
        } else {
          if (updated.productType === 'POTS') updated.productType = 'HSI'
          if (!updated.bandwidth) updated.bandwidth = '100 Mbps'
          updated.capacityMbps = 100
        }
      }
      if (field === 'bandwidth') {
        const num = parseFloat(String(value).replace(/[^0-9.]/g, ''))
        if (!isNaN(num)) updated.capacityMbps = num
      }
      next[index] = updated
      return next
    })
  }

  // Save Service Points (Revisi 4: Update Data Layanan)
  const handleSaveServicePoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIdLOP) return
    setSavingPoints(true)
    setSaveSuccessMessage("")
    setPointsError("")

    try {
      const payload: ProjectServicePoint[] = serviceRows.map((r) => ({
        id: r.id,
        idLOP: selectedIdLOP,
        serviceGroup: r.serviceGroup,
        productType: r.serviceGroup === 'POTS' ? 'HSI' : r.productType,
        capacityMbps: r.serviceGroup === 'POTS' ? 0 : r.capacityMbps,
        bandwidth: r.serviceGroup === 'POTS' ? null : r.bandwidth,
        location: r.serviceGroup === 'POTS' ? null : r.location,
        quote: r.serviceGroup === 'POTS' ? null : r.quote,
        orderNo: r.orderNo || null,
        sid: r.sid || (r.orderNo ? `ORD-${r.orderNo}` : ''),
        activeDate: r.activeDate || null,
      }))

      const ngtmaInfo = selectedProject?.category === 'NGTMA' ? {
        customerName: ngtmaCustomer,
        dinasName: ngtmaDinas,
        subsidiaryName: ngtmaSubsidiary,
      } : undefined

      const result = await ServicePoints.batchUpdate(selectedIdLOP, payload, ngtmaInfo)
      setSaveSuccessMessage(`${result.servicePoints.length} titik layanan berhasil disimpan dan diperbarui untuk ID LOP: ${selectedIdLOP}.`)
      
      // Refresh project list to reflect any customer/dinas updates
      void loadProjects()
    } catch (err) {
      setPointsError(err instanceof Error ? err.message : 'Gagal menyimpan data titik layanan.')
    } finally {
      setSavingPoints(false)
    }
  }

  // Catalog Handlers
  const handleSaveCatalog = (data: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (modal?.mode === "add") ServicesDB.create(data)
    else if (modal?.editId) ServicesDB.update(modal.editId, data)
    loadCatalog()
    setModal(null)
  }

  const handleDeleteCatalog = (id: string) => {
    ServicesDB.delete(id)
    loadCatalog()
    setDeleteConfirm(null)
  }

  const getEditInitial = (id: string): Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'> => {
    const svc = ServicesDB.getById(id)
    if (!svc) return blankForm()
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = svc
    return rest
  }

  const SERVICE_CATEGORIES = ["Semua", "On Channel", "GTMA", "NGTMA"]
  const filteredCatalog = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "Semua" || s.serviceType === filterType
    const matchCategory = filterCategory === "Semua" || s.category === filterCategory
    return matchSearch && matchType && matchCategory
  })

  return (
    <div className="space-y-6">
      {/* ─── TAB NAVIGATION HEADER ─── */}
      <div className="flex border-b border-slate-700/60 pb-3 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('service-points')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
            activeTab === 'service-points'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-500/20"
              : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <Layers size={16} />
          Pembaruan & Input Titik Layanan (per ID LOP)
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30">
            Revisi AM
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
            activeTab === 'catalog'
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-500/20"
              : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <Wifi size={16} />
          Katalog Paket Layanan Telkom
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: FORM & PEMBARUAN LAYANAN PER ID LOP (REVISI 1, 2, 4)         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'service-points' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 border border-blue-500/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 text-blue-400">
                <Network size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Input & Pembaruan Layanan per ID LOP (Account Manager)</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Pilih ID LOP untuk memuat data layanan tersimpan. AM dapat memperbarui instansi dinas, menambahkan banyak titik layanan (multiple input), serta menentukan klasifikasi <strong>POTS</strong> vs <strong>Non-POTS</strong>.
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs font-mono text-emerald-400 font-bold block">{projectsList.length} Proyek Terdaftar</span>
              <span className="text-[11px] text-slate-500">Database Witel Jateng Utara</span>
            </div>
          </div>

          <form onSubmit={handleSaveServicePoints} className="space-y-6">
            {/* 1. SELEKSI ID LOP & DETAIL PROYEK (REVISI 4) */}
            <div className="card-glass p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
                    1. Pilih ID LOP & Informasi Proyek (Revisi 4)
                  </h4>
                </div>
                <span className="text-xs text-slate-400">Hubungkan data layanan dengan ID LOP</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pilih ID LOP Proyek *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedIdLOP}
                      onChange={(e) => setSelectedIdLOP(e.target.value)}
                      className="form-input appearance-none pr-8 font-mono text-sm font-semibold text-blue-300"
                      disabled={loadingProjects}
                    >
                      {projectsList.length === 0 ? (
                        <option value="">Tidak ada proyek ditemukan</option>
                      ) : (
                        projectsList.map((p) => (
                          <option key={p.idLOP} value={p.idLOP}>
                            [{p.idLOP}] {p.agency} — {p.projectName}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Data layanan akan terhubung langsung ke proyek ini.</p>
                </div>

                {selectedProject && (
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Kategori Kontrak</span>
                      <span className={cn(
                        "font-bold px-2 py-0.5 rounded text-[10px] inline-block mt-0.5 border",
                        selectedProject.category === 'NGTMA'
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : selectedProject.category === 'GTMA'
                          ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      )}>
                        {selectedProject.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Status & Tahap</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block">{selectedProject.stage} ({selectedProject.status})</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 block">Nama Proyek</span>
                      <span className="font-semibold text-white truncate block">{selectedProject.projectName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. PENYESUAIAN FORM KATEGORI NGTMA (REVISI 1) */}
              {selectedProject?.category === 'NGTMA' && (
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                      Kategori NGTMA Aktif
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Field Khusus Layanan NGTMA (Revisi 1)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Field 1: Nama Pelanggan (Government Customer) */}
                    <div>
                      <label className="block text-xs font-semibold text-amber-200 mb-1.5">
                        Nama Pelanggan (Instansi Pemda) *
                      </label>
                      <div className="relative">
                        <select
                          value={ngtmaCustomer}
                          onChange={(e) => setNgtmaCustomer(e.target.value)}
                          className="form-input appearance-none pr-8 bg-slate-900 border-amber-500/40 text-white"
                        >
                          <option value="">Pilih Instansi Pemerintah...</option>
                          {MASTER_INSTANSI.map((inst) => (
                            <option key={inst.nama} value={inst.nama}>
                              {inst.nama} ({inst.tipe.toUpperCase()})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-amber-300/80 mt-1">Standarisasi Pemkot & Pemkab</p>
                    </div>

                    {/* Field 2: Nama Dinas (Terpisah) */}
                    <div>
                      <label className="block text-xs font-semibold text-amber-200 mb-1.5">
                        Nama Dinas (Terpisah) *
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          list="dinas-options"
                          value={ngtmaDinas}
                          onChange={(e) => setNgtmaDinas(e.target.value)}
                          placeholder="Contoh: Dinas Kominfo"
                          className="form-input bg-slate-900 border-amber-500/40 text-white"
                        />
                        <datalist id="dinas-options">
                          {MASTER_DINAS.map((d) => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                      </div>
                      <p className="text-[10px] text-amber-300/80 mt-1">Bisa pilih saran atau ketik manual</p>
                    </div>

                    {/* Field 3: Nama Anak Perusahaan */}
                    <div>
                      <label className="block text-xs font-semibold text-amber-200 mb-1.5">
                        Nama Anak Perusahaan Telkom
                      </label>
                      <input
                        type="text"
                        value={ngtmaSubsidiary}
                        onChange={(e) => setNgtmaSubsidiary(e.target.value)}
                        placeholder="Contoh: Telkom Akses / Infomedia"
                        className="form-input bg-slate-900 border-amber-500/40 text-white"
                      />
                      <p className="text-[10px] text-amber-300/80 mt-1">Mitra pelaksanaan NGTMA</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. MULTIPLE INPUT TITIK LAYANAN (REVISI 2 & KONDISI POTS / NON-POTS REVISI 1) */}
            <div className="card-glass p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/50 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
                      2. Input Titik Layanan — Multi-Input (Revisi 2)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Satu pelanggan dapat memiliki banyak titik layanan. Atur kondisi <strong>POTS</strong> (Nomor Order & SID saja) atau <strong>Non-POTS</strong> (lengkap).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="btn-primary flex items-center gap-1.5 self-start sm:self-auto text-xs py-2 px-3"
                  id="btn-add-point-row"
                >
                  <Plus size={14} />
                  Tambah Baris Titik Layanan
                </button>
              </div>

              {/* Astinet Mentor Note Banner */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Catatan Khusus Bimbingan:</strong> Layanan <strong>Astinet</strong> saat ini disediakan dengan opsi standar Non-POTS (lengkap dengan kapasitas bandwidth). Silakan sesuaikan jika instruksi mentor menetapkan Astinet tidak memerlukan field bandwidth.
                </div>
              </div>

              {loadingPoints ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Memuat data titik layanan untuk {selectedIdLOP}...
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceRows.map((row, idx) => {
                    const isPOTS = row.serviceGroup === 'POTS'
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-4 rounded-xl border transition-all duration-200 space-y-3",
                          isPOTS
                            ? "bg-slate-950/70 border-violet-500/30"
                            : "bg-slate-950/70 border-slate-700/80 hover:border-slate-600"
                        )}
                      >
                        {/* Row Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold font-mono text-slate-300">
                              {idx + 1}
                            </span>

                            {/* Kondisi Layanan Selector: POTS vs Non-POTS */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-400">Kondisi:</span>
                              <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => handleRowChange(idx, 'serviceGroup', 'Non-POTS')}
                                  className={cn(
                                    "px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer",
                                    !isPOTS
                                      ? "bg-blue-600 text-white shadow"
                                      : "text-slate-400 hover:text-white"
                                  )}
                                >
                                  Non-POTS
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRowChange(idx, 'serviceGroup', 'POTS')}
                                  className={cn(
                                    "px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1",
                                    isPOTS
                                      ? "bg-violet-600 text-white shadow"
                                      : "text-slate-400 hover:text-white"
                                  )}
                                >
                                  <PhoneCall size={11} />
                                  POTS
                                </button>
                              </div>
                            </div>

                            {isPOTS && (
                              <span className="text-[11px] text-violet-400 font-semibold hidden md:inline">
                                (Hanya Nomor Order & SID)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Hapus baris ini"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Row Form Fields based on POTS vs Non-POTS */}
                        {isPOTS ? (
                          /* POTS FIELDS: Hanya Nomor Order dan SID (Revisi 1) */
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-semibold text-violet-300 mb-1">
                                Nomor Order (POTS) *
                              </label>
                              <input
                                type="text"
                                value={row.orderNo}
                                onChange={(e) => handleRowChange(idx, 'orderNo', e.target.value)}
                                placeholder="Contoh: ORD-2026-POTS-001"
                                className="form-input text-xs"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-violet-300 mb-1">
                                Nomor SID (Service ID) *
                              </label>
                              <input
                                type="text"
                                value={row.sid}
                                onChange={(e) => handleRowChange(idx, 'sid', e.target.value)}
                                placeholder="Contoh: 024-8451234 / SID-091"
                                className="form-input text-xs font-mono"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                Tanggal Aktif (Opsional)
                              </label>
                              <input
                                type="date"
                                value={row.activeDate}
                                onChange={(e) => handleRowChange(idx, 'activeDate', e.target.value)}
                                className="form-input text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          /* Non-POTS FIELDS: Nama Produk, Bandwidth, Lokasi, Quote, Nomor Order, SID (Revisi 1) */
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
                            {/* 1. Nama Produk */}
                            <div className="lg:col-span-1">
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Nama Produk *
                              </label>
                              <div className="relative">
                                <select
                                  value={row.productType}
                                  onChange={(e) => handleRowChange(idx, 'productType', e.target.value)}
                                  className="form-input text-xs appearance-none pr-7 font-semibold"
                                >
                                  {NGTMA_PRODUCTS.map((prod) => (
                                    <option key={prod} value={prod}>{prod}</option>
                                  ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                            </div>

                            {/* 2. Bandwidth */}
                            <div className="lg:col-span-1">
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Bandwidth *
                              </label>
                              <input
                                type="text"
                                value={row.bandwidth}
                                onChange={(e) => handleRowChange(idx, 'bandwidth', e.target.value)}
                                placeholder="100 Mbps"
                                className="form-input text-xs"
                              />
                            </div>

                            {/* 3. Lokasi */}
                            <div className="lg:col-span-1">
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Lokasi Titik *
                              </label>
                              <input
                                type="text"
                                value={row.location}
                                onChange={(e) => handleRowChange(idx, 'location', e.target.value)}
                                placeholder="Gedung B Lt. 2"
                                className="form-input text-xs"
                              />
                            </div>

                            {/* 4. Quote */}
                            <div className="lg:col-span-1">
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Nomor Quote
                              </label>
                              <input
                                type="text"
                                value={row.quote}
                                onChange={(e) => handleRowChange(idx, 'quote', e.target.value)}
                                placeholder="Q-2026-001"
                                className="form-input text-xs"
                              />
                            </div>

                            {/* 5. Nomor Order */}
                            <div className="lg:col-span-1">
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                No. Order *
                              </label>
                              <input
                                type="text"
                                value={row.orderNo}
                                onChange={(e) => handleRowChange(idx, 'orderNo', e.target.value)}
                                placeholder="ORD-99120"
                                className="form-input text-xs"
                              />
                            </div>

                            {/* 6. SID & Tanggal Aktif */}
                            <div className="lg:col-span-1">
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                SID *
                              </label>
                              <input
                                type="text"
                                value={row.sid}
                                onChange={(e) => handleRowChange(idx, 'sid', e.target.value)}
                                placeholder="1029384756"
                                className="form-input text-xs font-mono text-emerald-400"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Status and Feedback Messages */}
              {pointsError && (
                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} />
                  {pointsError}
                </div>
              )}
              {saveSuccessMessage && (
                <div role="status" className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  {saveSuccessMessage}
                </div>
              )}

              {/* Save & Reset Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/50">
                <div className="text-xs text-slate-400">
                  Total Baris Input: <strong className="text-white">{serviceRows.length} titik layanan</strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedIdLOP) {
                        setSelectedIdLOP("")
                        setTimeout(() => setSelectedIdLOP(selectedIdLOP), 10)
                      }
                    }}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>

                  <button
                    type="submit"
                    disabled={savingPoints || !selectedIdLOP}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-50"
                    id="btn-save-service-points"
                  >
                    <Save size={14} />
                    {savingPoints ? "Menyimpan Data Layanan..." : "Simpan & Perbarui Semua Data Layanan"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: KATALOG PAKET LAYANAN TELKOM                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Layanan Katalog", value: services.length, color: "text-blue-400" },
              { label: "Layanan Aktif", value: services.filter(s => s.status === "Aktif").length, color: "text-emerald-400" },
              { label: "Avg Harga/Bulan", value: formatIDR(services.length ? Math.round(services.reduce((a, s) => a + s.priceMonthly, 0) / services.length) : 0), color: "text-violet-400" }
            ].map(s => (
              <div key={s.label} className="card-glass rounded-xl px-5 py-4"><p className="text-xs text-slate-500">{s.label}</p><p className={cn("text-xl font-bold mt-0.5", s.color)}>{s.value}</p></div>
            ))}
          </div>

          <div className="space-y-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari layanan katalog..." className="form-input py-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3">
              <label className="block text-xs font-semibold text-slate-400">
                Tipe Layanan
                <span className="relative mt-1.5 block">
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-input w-full appearance-none pr-8 text-sm font-normal">
                    <option value="Semua">Semua Tipe</option>
                    {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </span>
              </label>
              <label className="block text-xs font-semibold text-slate-400">
                Kategori
                <span className="relative mt-1.5 block">
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="form-input w-full appearance-none pr-8 text-sm font-normal">
                    {SERVICE_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category === "Semua" ? "Semua Kategori" : category === "On Channel" ? "Own Channel" : category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </span>
              </label>
              <button onClick={() => setModal({ open: true, mode: "add" })} className="btn-primary flex items-center justify-center gap-2" id="btn-add-service"><Plus size={15} />Tambah Layanan</button>
            </div>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4"><Wifi size={28} className="text-slate-600" /></div>
              <p className="text-sm font-semibold text-slate-400">Tidak ada layanan ditemukan</p>
              <p className="text-xs text-slate-600 mt-1">Coba ubah filter atau tambah layanan baru</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCatalog.map(svc => (
                <ServiceCard key={svc.id} item={svc} onEdit={() => setModal({ open: true, mode: "edit", editId: svc.id })} onDelete={() => setDeleteConfirm(svc.id)} />
              ))}
            </div>
          )}

          {modal?.open && <ServiceModal mode={modal.mode} initial={modal.mode === "edit" && modal.editId ? getEditInitial(modal.editId) : blankForm()} onSave={handleSaveCatalog} onClose={() => setModal(null)} />}
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
                  <button onClick={() => handleDeleteCatalog(deleteConfirm)} className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">Hapus</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
