'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyIndexPage() {
  const [folio, setFolio] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const f = folio.trim().toUpperCase();
    if (!f) return setError('Por favor ingresa un folio.');

    const res = await fetch(`/api/folio/${encodeURIComponent(f)}`);
    if (!res.ok) return setError('Folio no encontrado');

    const { verify_token } = await res.json();
    router.push(`/verify/${verify_token}`);
  };

  return (
    <main style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2>Verificar Orden por Folio</h2>
      <form onSubmit={handleSubmit} style={{ display:'flex', gap:8, marginBottom:16 }}>
        <input
          type="text"
          placeholder="Ej. CO-83AEE-2026-02-M-7023 o CP-BON-2025-08-0006"
          value={folio}
          onChange={e => setFolio(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit">Buscar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}
