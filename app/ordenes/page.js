'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function OrdenesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function load() {
      setErr('');
      setLoading(true);

      // Usuario logueado
      const { data: usr } = await supabase.auth.getUser();
      if (!usr.user) {
        setErr('No hay sesión activa');
        setLoading(false);
        return;
      }

      // Buscamos su registro en colaboradores
      const { data: col, error: eCol } = await supabase
        .from('colaborador')
        .select('id')
        .eq('email', usr.user.email)
        .single();
      if (eCol || !col) {
        setErr('Colaborador desconocido');
        setLoading(false);
        return;
      }

      // Traemos sus órdenes
      const { data, error } = await supabase
        .from('orden_pago')
        .select('folio, periodo, frecuencia, neto, estado, verify_token')
        .eq('colaborador_id', col.id)
        .order('created_at', { ascending: false });

      if (error) setErr(error.message);
      else setRows(data || []);
      setLoading(false);
    }
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
        <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 800 }}>
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
            {rows.map(r => (
              <tr key={r.folio} style={{ borderBottom: '1px solid #eee' }}>
                <td>{r.periodo}</td>
                <td>{r.folio}</td>
                <td>{r.frecuencia}</td>
                <td>Q {r.neto}</td>
                <td>{r.estado}</td>
                <td>
                  <Link href={/verify/${r.verify_token}} target="_blank">Verificar</Link> |{' '}
                  <a href={/api/ordenes/pdf/${r.verify_token}} target="_blank">PDF</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
