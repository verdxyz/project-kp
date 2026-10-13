// Utility: class merger
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

// Format currency in IDR with explicit space between "Rp" and digits
export function formatIDR(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'Rp 0'
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
}

// Abbreviate large numbers with explicit space between "Rp" and digits
export function abbreviateIDR(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'Rp 0'
  if (value >= 1_000_000_000) {
    const formatted = (value / 1_000_000_000).toFixed(1).replace('.0', '')
    return `Rp ${formatted} M`
  }
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(0)
    return `Rp ${formatted} Jt`
  }
  return formatIDR(value)
}
