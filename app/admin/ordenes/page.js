'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminOrdenesSearch() {
  const [idpub, setIdpub] = useState('');
  const router = useRouter();

  return (
    <main>
      <h2>Admin: Ver órdenes por ID de colaborador</h2>
      <form onSubmit={e => { e.preventDefault(); if (idpub.trim()) router.push(`/admin/ordenes/${encodeURIComponent(idpub.trim())}`); }}>
        <input
          value={idpub}
          onChange={e => setIdpub(e.target.value)}
          placeholder="Ej: CO-AB12CD"
          style={{ padding: 8, width: 280, marginRight: 8 }}
        />
        <button type="submit">Ver historial</button>
      </form>
    </main>
  );
}
