import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import './index.css'

createInertiaApp({
  resolve: (name) => {
    if (name !== 'Portal') throw new Error(`Halaman Inertia tidak dikenal: ${name}`)
    return import('./App.tsx').then(({ default: Page }) => Page)
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <StrictMode>
        <App {...props} />
      </StrictMode>,
    )
  },
})
