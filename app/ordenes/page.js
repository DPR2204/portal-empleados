'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function OrdenesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');

      // 1) Usuario actual
      const { data: userData, error: eUser } = await supabase.auth.getUser();
      const user = userData?.user;
      if (eUser || !user) {
        setErr('No hay sesión activa');
        setLoading(false);
        return;
      }

      // 2) Intenta enlazar por email -> auth_user_id (si ya existe, no pasa nada)
      try { await supabase.rpc('link_me'); } catch (_) {}

      // 3) Obtén el colaborador por auth_user_id (sin single/maybeSingle)
      const { data: colRows, error: colErr } = await supabase
        .from('colaborador')
        .select('id')
        .eq('auth_user_id', user.id)
        .limit(1);

      if (colErr) {
        setErr(colErr.message || 'Error buscando colaborador');
        setLoading(false);
        return;
      }

      const col = (colRows && colRows[0]) || null;
      if (!col) {
        setErr('Colaborador desconocido');
        setLoading(false);
        return;
      }

      // 4) Trae órdenes del colaborador
      const selectCols =
        'folio, periodo, frecuencia, neto, estado, verify_token, fecha_pago, created_at';

      async function fetchOrdersBy(columnName) {
        // intenta ordenar por fecha_pago; si no existe, usa created_at
        let q = supabase.from('orden_pago').select(selectCols).eq(columnName, col.id);

        let { data, error } = await q.order('fecha_pago', { ascending: false });
        if (error && String(error.message).toLowerCase().includes('fecha_pago')) {
          ({ data, error } = await supabase
            .from('orden_pago')
            .select(selectCols)
            .eq(columnName, col.id)
            .order('created_at', { ascending: false }));
        }
        return { data: data || [], error };
      }

      // primero probamos con 'colaborador_id'; si la columna no existe, reintentamos con 'colaborador'
      let { data, error } = await fetchOrdersBy('colaborador_id');
      if (error && String(error.message).toLowerCase().includes('colaborador_id')) {
        ({ data, error } = await fetchOrdersBy('colaborador'));
      }

      if (error) {
        setErr(error.message);
      } else {
        setRows(data);
      }

      setLoading(false);
    })();
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
                  <Link href={`/verify/${r.verify_token}`} target="_blank">Verificar</Link>{' | '}
                  <a href={`/api/ordenes/pdf/${r.verify_token}`} target="_blank" rel="noreferrer">PDF</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
