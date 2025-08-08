'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';

export default function AdminOrdenesDeColab() {
  const { id } = useParams(); // id público
  const id_publico = decodeURIComponent(id);
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [col, setCol] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setErr(''); setLoading(true);

      // 0) Verifica sesión y rol ADMIN en profiles
      const { data: udata, error: eUser } = await supabase.auth.getUser();
      const user = udata?.user;
      if (eUser || !user) { setErr('No hay sesión activa'); setLoading(false); return; }

      const { data: me, error: eProf } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('role', 'ADMIN')
        .maybeSingle();

      if (eProf) { setErr(eProf.message); setLoading(false); return; }
      if (!me)   { setErr('No autorizado'); setLoading(false); return; }

      // 1) Buscar colaborador por id_publico
      const { data: colaborador, error: eCol } = await supabase
        .from('colaborador')
        .select('id, id_publico, nombres, apellidos, email')
        .eq('id_publico', id_publico)
        .maybeSingle();

      if (eCol) { setErr(eCol.message); setLoading(false); return; }
      if (!colaborador) { setErr('Colaborador no encontrado'); setLoading(false); return; }
      setCol(colaborador);

      // 2) Traer sus órdenes
      const { data, error } = await supabase
        .from('orden_pago')
        .select('folio, periodo, frecuencia, neto, estado, verify_token, created_at')
        .eq('colaborador_id', colaborador.id)
        .order('created_at', { ascending: false });

      if (error) setErr(error.message); else setRows(data ?? []);
      setLoading(false);
    })();
  }, [id_publico]);

  if (loading) return <main><p>Cargando…</p></main>;
  if (err)     return <main><p style={{ color:'red' }}>Error: {err}</p></main>;

  return (
    <main>
      <p><a onClick={() => router.push('/admin/ordenes')} style={{ cursor:'pointer' }}>← Buscar otro</a></p>
      <h2>Órdenes de {col?.nombres} {col?.apellidos} ({col?.id_publico})</h2>
      <p style={{ color:'#666', fontSize:12 }}>{col?.email}</p>

      {rows.length === 0 ? (
        <p>Sin órdenes.</p>
      ) : (
        <table style={{ borderCollapse:'collapse', width:'100%', maxWidth: 900, marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left' }}>Periodo</th>
              <th>Folio</th>
              <th>Frecuencia</th>
              <th>Neto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.folio} style={{ borderBottom:'1px solid #eee' }}>
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
