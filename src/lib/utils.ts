// Utility: class merger
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

// Format currency in IDR
export function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Abbreviate large numbers
export function abbreviateIDR(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(0)} Jt`
  }
  return formatIDR(value)
}
