import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL belum diatur. Tambahkan nilainya ke file .env.')
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY belum diatur. Tambahkan nilainya ke file .env.')
}

try {
  const parsedUrl = new URL(supabaseUrl)
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('URL harus menggunakan protokol HTTP atau HTTPS.')
  }
} catch (error) {
  throw new Error('VITE_SUPABASE_URL bukan URL yang valid.', { cause: error })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
