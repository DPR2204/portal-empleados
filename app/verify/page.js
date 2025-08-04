// app/verify/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyByFolioPage() {
  const [folio, setFolio] = useState('')
  const router = useRouter()

  const onSubmit = e => {
    e.preventDefault()
    if (folio.trim()) {
      // Navega a /verify/folio/{folio}
      router.push(`/verify/folio/${encodeURIComponent(folio.trim())}`)
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2>Verificar Orden por Folio</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <input
          type="text"
          placeholder="Introduce el folio (ej. 2025-09-M-7481)"
          value={folio}
          onChange={e => setFolio(e.target.value)}
          required
        />
        <button type="submit">Buscar</button>
      </form>
    </main>
  )
}
