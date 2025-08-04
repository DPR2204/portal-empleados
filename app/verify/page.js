'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyIndexPage() {
  const [folio, setFolio] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    // Llamamos a nuestro nuevo endpoint para buscar el token por folio
    const res = await fetch(`/api/ordenes/folio/${encodeURIComponent(folio)}`)
    if (!res.ok) {
      setError('Folio no encontrado')
      return
    }
    const { verify_token } = await res.json()
    // Redirigimos a la página de verificación por token
    router.push(`/verify/${verify_token}`)
  }

  return (
    <main>
      <h2>Verificar Orden por Folio</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Escribe el folio completo"
          value={folio}
          onChange={(e) => setFolio(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit">Buscar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  )
}
