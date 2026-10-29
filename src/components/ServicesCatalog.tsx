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
  Save,
  RotateCcw,
  PhoneCall,
  CheckCircle2,
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
  "Astinet": "bg-white border-[#E5E5E5] text-[#1C1C1E]",
  "VPN IP": "bg-white border-[#E5E5E5] text-[#1C1C1E]",
  "Metro Ethernet": "bg-white border-[#E5E5E5] text-[#1C1C1E]",
  "SD-WAN": "bg-white border-[#E5E5E5] text-[#1C1C1E]",
  "Lainnya": "bg-white border-[#E5E5E5] text-[#1C1C1E]",
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
      <div className="absolute inset-0 bg-black/70 " onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#F9F8F6] border border-[#E5E5E5] rounded-2xl  ">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-[#F9F8F6]  z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F3F3F1] border border-[#E5E5E5] flex items-center justify-center"><Wifi size={16} className="text-[#666666]" /></div>
            <h3 className="text-base font-bold text-[#1C1C1E]">{mode === "add" ? "Tambah Layanan Baru" : "Edit Layanan"}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FFFFFF] text-[#666666] hover:text-[#1C1C1E] transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1.5">Nama Layanan *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Contoh: Astinet Dedicated 100 Mbps" className={cn("form-input", errors.name && "border-[#E5E5E5]")} />
            {errors.name && <p className="text-xs text-[#666666] mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">Kategori</label>
              <div className="relative">
                <select value={form.category} onChange={e => set("category", e.target.value)} className="form-input appearance-none pr-8">
                  <option value="On Channel">Own Channel</option>
                  <option value="GTMA">GTMA</option>
                  <option value="NGTMA">NGTMA</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">Tipe Layanan</label>
              <div className="relative">
                <select value={form.serviceType} onChange={e => set("serviceType", e.target.value)} className="form-input appearance-none pr-8">
                  {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">Bandwidth</label>
              <input value={form.bandwidth ?? ""} onChange={e => set("bandwidth", e.target.value)} placeholder="Contoh: 100 Mbps" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">SLA</label>
              <input value={form.sla} onChange={e => set("sla", e.target.value)} placeholder="Contoh: 99.5%" className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">Harga Monthly (Rp) *</label>
              <input type="number" value={form.priceMonthly || ""} onChange={e => set("priceMonthly", Number(e.target.value))} placeholder="0" className={cn("form-input", errors.priceMonthly && "border-[#E5E5E5]")} />
              {errors.priceMonthly && <p className="text-xs text-[#666666] mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.priceMonthly}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1.5">Harga OTC (Rp)</label>
              <input type="number" step="0.01" value={form.priceOTC ?? ""} onChange={e => set("priceOTC", e.target.value ? Number(e.target.value) : undefined)} placeholder="Opsional" className="form-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1.5">Deskripsi *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Jelaskan layanan ini secara singkat..." className={cn("form-input resize-none", errors.description && "border-[#E5E5E5]")} />
            {errors.description && <p className="text-xs text-[#666666] mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.description}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#666666]">Fitur / Keunggulan</label>
              <button type="button" onClick={addFeature} className="text-xs text-[#666666] hover:text-[#666666] flex items-center gap-1 transition-colors"><Plus size={12} /> Tambah</button>
            </div>
            <div className="space-y-2">
              {form.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={f} onChange={e => setFeature(i, e.target.value)} placeholder={`Fitur ${i + 1}`} className="form-input flex-1" />
                  {form.features.length > 1 && <button type="button" onClick={() => removeFeature(i)} className="p-1.5 rounded-lg text-[#666666] hover:text-[#666666] hover:bg-[#F3F3F1] transition-colors"><X size={14} /></button>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1.5">Status</label>
            <div className="flex gap-3">
              {["Aktif", "Tidak Aktif"].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => set("status", s)} className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer", form.status === s ? "border-[#E5E5E5] bg-[#F3F3F1]" : "border-[#E5E5E5]")}>
                    {form.status === s && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-[#666666]">{s}</span>
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
    <div className={cn("group relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5", colorClass)}>
      <div className="absolute top-4 right-4">
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", item.status === "Aktif" ? "bg-[#F3F3F1] text-[#666666] border border-[#E5E5E5]" : "bg-[#F3F3F1] text-[#666666] border border-[#E5E5E5]")}>{item.status}</span>
      </div>
      <div className="flex items-start gap-3 mb-4">
        <div className={cn("w-10 h-10 rounded-xl border  flex items-center justify-center flex-shrink-0", colorClass)}><Icon size={20} /></div>
        <div className="min-w-0 pr-16">
          <h3 className="text-sm font-bold text-[#1C1C1E] leading-tight truncate">{item.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#666666]">{item.serviceType}</span>
            {item.bandwidth && <><span className="text-[#666666]">·</span><span className="text-xs text-[#666666]">{item.bandwidth}</span></>}
          </div>
        </div>
      </div>
      <p className="text-xs text-[#666666] mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
      {item.features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.features.slice(0, 3).map(f => <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E5E5E5] text-[#666666]">{f}</span>)}
          {item.features.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E5E5E5] text-[#666666]">+{item.features.length - 3}</span>}
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
        <div><p className="text-xs text-[#666666]">Monthly</p><p className="text-sm font-bold text-[#1C1C1E]">{formatIDR(item.priceMonthly)}</p></div>
        <div className="text-right"><p className="text-xs text-[#666666]">SLA</p><p className="text-sm font-semibold text-[#666666]">{item.sla}</p></div>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={onEdit} className="p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E5E5] text-[#666666] hover:text-[#666666] hover:border-[#E5E5E5] transition-colors" title="Edit"><Edit3 size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E5E5] text-[#666666] hover:text-[#666666] hover:border-[#E5E5E5] transition-colors" title="Hapus"><Trash2 size={13} /></button>
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
  servicePrice: number
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
    servicePrice: 0,
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
      setLoadingPoints(false)
      return
    }

    const proj = projectsList.find((p) => p.idLOP === selectedIdLOP.trim())
    if (!proj) {
      setSelectedProject(null)
      setLoadingPoints(false)
      setSaveSuccessMessage("")
      setPointsError("")
      setServiceRows([emptyServicePointRow()])
      return
    }

    setSelectedProject(proj)
    setNgtmaCustomer(proj.customerName || proj.agency || "")
    setNgtmaDinas(proj.dinasName || "")
    setNgtmaSubsidiary(proj.subsidiaryName || "")

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
            servicePrice: pt.servicePrice ?? 0,
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
              servicePrice: proj?.servicePrice ?? 0,
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

  // Service Row Actions (Multiple Input)
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
    if (!selectedProject || selectedProject.idLOP !== selectedIdLOP.trim()) {
      setPointsError("ID LOP harus cocok dengan proyek yang sudah terdaftar.")
      return
    }
    const idLOP = selectedProject.idLOP
    setSavingPoints(true)
    setSaveSuccessMessage("")
    setPointsError("")

    try {
      const rowsToSave = serviceRows.filter((row) => (
        row.sid.trim()
        || row.orderNo.trim()
        || row.location.trim()
        || row.quote.trim()
        || row.servicePrice > 0
        || row.serviceGroup === 'POTS'
        || row.bandwidth !== '100 Mbps'
        || row.productType !== 'HSI'
      ))
      if (rowsToSave.some((row) => !Number.isFinite(row.servicePrice) || row.servicePrice <= 0)) {
        setPointsError("Harga layanan wajib diisi dan harus lebih dari nol untuk setiap titik.")
        setSavingPoints(false)
        return
      }
      const payload: ProjectServicePoint[] = rowsToSave.map((r) => ({
        id: r.id,
        idLOP,
        serviceGroup: r.serviceGroup,
        productType: r.serviceGroup === 'POTS' ? 'HSI' : r.productType,
        capacityMbps: r.serviceGroup === 'POTS' ? 0 : r.capacityMbps,
        bandwidth: r.serviceGroup === 'POTS' ? null : r.bandwidth,
        location: r.serviceGroup === 'POTS' ? null : r.location,
        quote: r.serviceGroup === 'POTS' ? null : r.quote,
        orderNo: r.orderNo || null,
        sid: r.sid || (r.orderNo ? `ORD-${r.orderNo}` : ''),
        servicePrice: r.servicePrice,
        activeDate: r.activeDate || null,
      }))

      const ngtmaInfo = selectedProject?.category === 'NGTMA' ? {
        customerName: ngtmaCustomer,
        dinasName: ngtmaDinas,
        subsidiaryName: ngtmaSubsidiary,
      } : undefined

      const result = await ServicePoints.batchUpdate(idLOP, payload, ngtmaInfo)
      setSaveSuccessMessage(`${result.servicePoints.length} titik layanan berhasil disimpan dan diperbarui untuk ID LOP: ${idLOP}.`)
      
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
      <div className="flex border-b border-[#E5E5E5] pb-3 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('service-points')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
            activeTab === 'service-points'
              ? "bg-black text-[#1C1C1E]   ring-2 ring-[#E5E5E5]"
              : "bg-[#FFFFFF] text-[#666666] hover:text-[#1C1C1E] hover:bg-[#FFFFFF]"
          )}
        >
          <Layers size={16} />
          Pembaruan & Input Titik Layanan (per ID LOP)

        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
            activeTab === 'catalog'
              ? "bg-black text-[#1C1C1E]   ring-2 ring-[#E5E5E5]"
              : "bg-[#FFFFFF] text-[#666666] hover:text-[#1C1C1E] hover:bg-[#FFFFFF]"
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
          <form onSubmit={handleSaveServicePoints} className="space-y-6">
            {/* 1. SELEKSI ID LOP & DETAIL PROYEK */}
            <div className="bg-white border border-[#E5E5E5] p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F3F3F1]"></span>
                  <h4 className="text-sm font-bold text-[#1C1C1E] uppercase tracking-wider text-[11px]">
                    1. Pilih ID LOP & Informasi Proyek{selectedProject ? ` (${selectedProject.stage})` : ''}
                  </h4>
                </div>
              </div>

              <div>
                <select
                  value={selectedIdLOP}
                  onChange={(e) => setSelectedIdLOP(e.target.value)}
                  className="form-input font-mono text-sm font-semibold text-[#666666]"
                  disabled={loadingProjects}
                >
                  <option value="">
                    {loadingProjects ? "Memuat daftar ID LOP..." : "Pilih ID LOP"}
                  </option>
                  {projectsList.map((project) => (
                    <option key={project.idLOP} value={project.idLOP}>
                      {project.idLOP} — {project.agency} — {project.projectName}
                    </option>
                  ))}
                </select>
                  {selectedIdLOP.trim() && !selectedProject && !loadingProjects && (
                    <p role="alert" className="mt-1 text-[11px] text-[#666666]">
                      ID LOP tidak ditemukan. Pilih proyek yang sudah terdaftar.
                    </p>
                  )}
              </div>

              {/* 2. PENYESUAIAN FORM KATEGORI NGTMA (REVISI 1) */}
              {selectedProject?.category === 'NGTMA' && (
                <div className="mt-4 p-4 rounded-xl bg-[#F3F3F1] border border-[#E5E5E5] space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#F3F3F1] text-[#666666] border border-[#E5E5E5] text-[10px] font-bold">
                      Kategori NGTMA Aktif
                    </span>
                    <span className="text-xs font-semibold text-[#1C1C1E]">
                      Field Khusus Layanan NGTMA (Revisi 1)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Field 1: Nama Pelanggan (Government Customer) */}
                    <div>
                      <label className="block text-xs font-semibold text-[#666666] mb-1.5">
                        Nama Pelanggan (Instansi Pemda) *
                      </label>
                      <div className="relative">
                        <select
                          value={ngtmaCustomer}
                          onChange={(e) => setNgtmaCustomer(e.target.value)}
                          className="form-input appearance-none pr-8 bg-[#F9F8F6] border-[#E5E5E5] text-[#1C1C1E]"
                        >
                          <option value="">Pilih Instansi Pemerintah...</option>
                          {MASTER_INSTANSI.map((inst) => (
                            <option key={inst.nama} value={inst.nama}>
                              {inst.nama} ({inst.tipe.toUpperCase()})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-[#666666] mt-1">Standarisasi Pemkot & Pemkab</p>
                    </div>

                    {/* Field 2: Nama Dinas (Terpisah) */}
                    <div>
                      <label className="block text-xs font-semibold text-[#666666] mb-1.5">
                        Nama Dinas (Terpisah) *
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          list="dinas-options"
                          value={ngtmaDinas}
                          onChange={(e) => setNgtmaDinas(e.target.value)}
                          placeholder="Contoh: Dinas Kominfo"
                          className="form-input bg-[#F9F8F6] border-[#E5E5E5] text-[#1C1C1E]"
                        />
                        <datalist id="dinas-options">
                          {MASTER_DINAS.map((d) => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                      </div>
                      <p className="text-[10px] text-[#666666] mt-1">Bisa pilih saran atau ketik manual</p>
                    </div>

                    {/* Field 3: Nama Anak Perusahaan */}
                    <div>
                      <label className="block text-xs font-semibold text-[#666666] mb-1.5">
                        Nama Anak Perusahaan Telkom
                      </label>
                      <input
                        type="text"
                        value={ngtmaSubsidiary}
                        onChange={(e) => setNgtmaSubsidiary(e.target.value)}
                        placeholder="Contoh: Telkom Akses / Infomedia"
                        className="form-input bg-[#F9F8F6] border-[#E5E5E5] text-[#1C1C1E]"
                      />
                      <p className="text-[10px] text-[#666666] mt-1">Mitra pelaksanaan NGTMA</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. MULTIPLE INPUT TITIK LAYANAN (KONDISI POTS / NON-POTS) */}
            <div className="bg-white border border-[#E5E5E5] p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F3F3F1]"></span>
                    <h4 className="text-sm font-bold text-[#1C1C1E] uppercase tracking-wider text-[11px]">
                      2. Input Titik Layanan — Multi-Input
                    </h4>
                  </div>
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

              {loadingPoints ? (
                <div className="py-12 text-center text-xs text-[#666666]">
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
                            ? "bg-[#F9F8F6] border-[#E5E5E5]"
                            : "bg-[#F9F8F6] border-[#E5E5E5] hover:border-[#E5E5E5]"
                        )}
                      >
                        {/* Row Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-[#FFFFFF] flex items-center justify-center text-xs font-bold font-mono text-[#666666]">
                              {idx + 1}
                            </span>

                            {/* Kondisi Layanan Selector: POTS vs Non-POTS */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#666666]">Kondisi:</span>
                              <div className="flex rounded-lg bg-[#F9F8F6] p-0.5 border border-[#E5E5E5]">
                                <button
                                  type="button"
                                  onClick={() => handleRowChange(idx, 'serviceGroup', 'Non-POTS')}
                                  className={cn(
                                    "px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer",
                                    !isPOTS
                                      ? "bg-black text-[#1C1C1E] "
                                      : "text-[#666666] hover:text-[#1C1C1E]"
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
                                      ? "bg-black text-[#1C1C1E] "
                                      : "text-[#666666] hover:text-[#1C1C1E]"
                                  )}
                                >
                                  <PhoneCall size={11} />
                                  POTS
                                </button>
                              </div>
                            </div>

                            {isPOTS && (
                              <span className="text-[11px] text-[#666666] font-semibold hidden md:inline">
                                (Hanya Nomor Order & SID)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1.5 rounded-lg text-[#666666] hover:text-[#666666] hover:bg-[#F3F3F1] transition-colors cursor-pointer"
                              title="Hapus baris ini"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Row Form Fields based on POTS vs Non-POTS */}
                        {isPOTS ? (
                          /* POTS FIELDS: Hanya Nomor Order dan SID (Revisi 1) */
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                No. Order
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
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                SID
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
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                Tanggal Aktif (Opsional)
                              </label>
                              <input
                                type="date"
                                value={row.activeDate}
                                onChange={(e) => handleRowChange(idx, 'activeDate', e.target.value)}
                                className="form-input text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                Harga Layanan (Rp)
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={row.servicePrice || ''}
                                onChange={(e) => handleRowChange(idx, 'servicePrice', Number(e.target.value))}
                                placeholder="Contoh: 1500000"
                                className="form-input text-xs"
                                required
                              />
                            </div>
                          </div>
                        ) : (
                          /* Non-POTS FIELDS: Nama Produk, Bandwidth, Lokasi, Quote, Nomor Order, SID (Revisi 1) */
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-1">
                            {/* 1. Nama Produk */}
                            <div className="lg:col-span-1">
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                Nama Produk
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
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
                              </div>
                            </div>

                            {/* 2. Bandwidth */}
                            <div className="lg:col-span-1">
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                Bandwidth
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
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                Lokasi Titik
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
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
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
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                No. Order
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
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                SID
                              </label>
                              <input
                                type="text"
                                value={row.sid}
                                onChange={(e) => handleRowChange(idx, 'sid', e.target.value)}
                                placeholder="1029384756"
                                className="form-input text-xs font-mono text-[#666666]"
                                required
                              />
                            </div>
                            <div className="lg:col-span-1">
                              <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                                Harga Layanan (Rp)
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={row.servicePrice || ''}
                                onChange={(e) => handleRowChange(idx, 'servicePrice', Number(e.target.value))}
                                placeholder="1500000"
                                className="form-input text-xs"
                                required
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
                <div role="alert" className="p-3 rounded-xl bg-[#F3F3F1] border border-[#E5E5E5] text-xs text-[#666666] flex items-center gap-2">
                  <AlertCircle size={15} />
                  {pointsError}
                </div>
              )}
              {saveSuccessMessage && (
                <div role="status" className="p-3 rounded-xl bg-[#F3F3F1] border border-[#E5E5E5] text-xs text-[#666666] flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  {saveSuccessMessage}
                </div>
              )}

              {/* Save & Reset Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E5E5]">
                <div className="text-xs text-[#666666]">
                  Total Baris Input: <strong className="text-[#1C1C1E]">{serviceRows.length} titik layanan</strong>
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
                    disabled={savingPoints || !selectedProject || selectedProject.idLOP !== selectedIdLOP.trim()}
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
              { label: "Total Layanan Katalog", value: services.length, color: "text-[#666666]" },
              { label: "Layanan Aktif", value: services.filter(s => s.status === "Aktif").length, color: "text-[#666666]" },
              { label: "Avg Harga/Bulan", value: formatIDR(services.length ? Math.round(services.reduce((a, s) => a + s.priceMonthly, 0) / services.length) : 0), color: "text-[#666666]" }
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#E5E5E5] rounded-xl px-5 py-4"><p className="text-xs text-[#666666]">{s.label}</p><p className={cn("text-xl font-bold mt-0.5", s.color)}>{s.value}</p></div>
            ))}
          </div>

          <div className="space-y-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari layanan katalog..." className="form-input py-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3">
              <label className="block text-xs font-semibold text-[#666666]">
                Tipe Layanan
                <span className="relative mt-1.5 block">
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-input w-full appearance-none pr-8 text-sm font-normal">
                    <option value="Semua">Semua Tipe</option>
                    {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
                </span>
              </label>
              <label className="block text-xs font-semibold text-[#666666]">
                Kategori
                <span className="relative mt-1.5 block">
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="form-input w-full appearance-none pr-8 text-sm font-normal">
                    {SERVICE_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category === "Semua" ? "Semua Kategori" : category === "On Channel" ? "Own Channel" : category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
                </span>
              </label>
              <button onClick={() => setModal({ open: true, mode: "add" })} className="btn-primary flex items-center justify-center gap-2" id="btn-add-service"><Plus size={15} />Tambah Layanan</button>
            </div>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center mb-4"><Wifi size={28} className="text-[#666666]" /></div>
              <p className="text-sm font-semibold text-[#666666]">Tidak ada layanan ditemukan</p>
              <p className="text-xs text-[#666666] mt-1">Coba ubah filter atau tambah layanan baru</p>
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
              <div className="absolute inset-0 bg-black/70 " onClick={() => setDeleteConfirm(null)} />
              <div className="relative bg-[#F9F8F6] border border-[#E5E5E5] rounded-2xl p-6 max-w-sm w-full ">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F3F1] border border-[#E5E5E5] flex items-center justify-center"><Trash2 size={18} className="text-[#666666]" /></div>
                  <div><h4 className="text-sm font-bold text-[#1C1C1E]">Hapus Layanan</h4><p className="text-xs text-[#666666] mt-0.5">Aksi ini tidak bisa dibatalkan</p></div>
                </div>
                <p className="text-sm text-[#666666] mb-5">Apakah Anda yakin ingin menghapus layanan <strong className="text-[#1C1C1E]">{services.find(s => s.id === deleteConfirm)?.name}</strong>?</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Batal</button>
                  <button onClick={() => handleDeleteCatalog(deleteConfirm)} className="flex-1 px-4 py-2 rounded-xl bg-black hover:bg-[#F3F3F1] text-[#1C1C1E] text-sm font-semibold transition-colors">Hapus</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
