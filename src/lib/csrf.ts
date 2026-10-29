export function csrfHeaders(): Record<string, string> {
  const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
  return token ? { 'X-CSRF-TOKEN': token } : {}
}
