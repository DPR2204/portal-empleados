'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function OrdenesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const load = async () => {
      setErr('');
      setLoading(true);

      // Usuario
      const { data: { user }, error: eUser } = await supabase.auth.getUser();
      if (eUser || !user) {
        setErr('No hay sesión activa');
        setLoading(false);
        return;
      }

      // Enlaza por email -> auth_user_id si hiciera falta (no falla si ya existe)
      try { await supabase.rpc('link_me'); } catch {}

      // ----- Consulta por JOIN usando auth_user_id (intento 1: FK = colaborador_id) -----
      let res = await supabase
        .from('orden_pago')
        .select(`
          folio, periodo, frecuencia, neto, estado, verify_token, created_at,
          colaborador:colaborador_id ( auth_user_id )
        `)
        .eq('colaborador.auth_user_id', user.id)
        .order('created_at', { ascending: false });

      // Si tu FK se llama 'colaborador' (sin _id), reintenta así:
      if (res.error && String(res.error.message).toLowerCase().includes('colaborador_id')) {
        res = await supabase
          .from('orden_pago')
          .select(`
            folio, periodo, frecuencia, neto, estado, verify_token, created_at,
            colaborador ( auth_user_id )
          `)
          .eq('colaborador.auth_user_id', user.id)
          .order('created_at', { ascending: false });
      }

      if (res.error) setErr(res.error.message);
      else setRows(res.data ?? []);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <main><p>Cargando órdenes…</p></main>;
  if (err)     return <main><p style={{ color: 'red' }}>Error: {err}</p></main>;

  return (
    <main>
      <h2>Mis Órdenes</h2>
      {rows.length === 0 ? (
        <p>No has generado aún ninguna orden.</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Periodo</th>
              <th>Folio</th>
              <th>Frecuencia</th>
              <th>Neto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.folio} style={{ borderBottom: '1px solid #eee' }}>
                <td>{r.periodo}</td>
                <td>{r.folio}</td>
                <td>{r.frecuencia}</td>
                <td>Q {Number(r.neto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                <td>{r.estado ?? '—'}</td>
                <td>
                  <Link href={`/verify/${r.verify_token}`} target="_blank" rel="noopener noreferrer">Verificar</Link>{' | '}
                  <a href={`/api/ordenes/pdf/${r.verify_token}`} target="_blank" rel="noopener noreferrer">PDF</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
