export async function readJsonResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text()

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(
      `Server API mengirim respons yang bukan JSON (HTTP ${response.status}). ` +
      'Periksa konfigurasi proxy /api ke backend.',
    )
  }
}
