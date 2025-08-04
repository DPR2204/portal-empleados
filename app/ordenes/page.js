// app/ordenes/page.js
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
      setLoading(true); setErr('');

      // 1) Traer roles de usuario
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return setErr('Sesión no encontrada');

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('user_id', user.id).single();

      const isAdmin = ['RH','FINANZAS','ADMIN'].includes(profile.role);

      // 2) Consulta de órdenes
      let query = supabase
        .from('orden_pago')
        .select('folio,periodo,frecuencia,neto,estado,verify_token')
        .order('created_at',{ascending:false});

      if (!isAdmin) {
        // colaborador normal → solo sus órdenes
        const { data: col } = await supabase
          .from('colaborador').select('id').eq('email', user.email).single();
        query = query.eq('colaborador_id', col.id);
      }

      const { data, error } = await query;
      if (error) setErr(error.message);
      else setRows(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <main><p>Cargando…</p></main>;
  if (err)     return <main><p style={{color:'red'}}>Error: {err}</p></main>;

  return (
    <main>
      <h2>Órdenes</h2>
      {rows.length === 0
        ? <p>No hay órdenes.</p>
        : (
          <table style={{ borderCollapse:'collapse', width:'100%', maxWidth:800 }}>
            <thead>…</thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.verify_token}>…</tr>
              ))}
            </tbody>
          </table>
        )}
    </main>
  );
}
