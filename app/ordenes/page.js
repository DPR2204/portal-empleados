'use client';
import { useEffect, useState } from 'react';
// Usa UNA de estas dos líneas (deja la correcta y borra la otra):
import { supabase } from '@/lib/supabaseClient';         // con alias @
// import { supabase } from '../../lib/supabaseClient';   // sin alias

export default function OrdenesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function load() {
      setErr('');
      setLoading(true);

      const { data: userData, error: eUser } = await supabase.auth.getUser();
      const user = userData?.user;
      if (eUser || !user) {
        setErr('No hay sesión activa');
        setLoading(false);
        return;
      }

      // Intento de vincular por email si faltó (no rompe si ya existe)
      try { await supabase.rpc('link_me'); } catch {}

      // Gracias a RLS, esto ya devuelve SOLO tus órdenes
      const { data, error } = await supabase
        .from('orden_pago')
        .select('folio, periodo, frecuencia, neto, estado, verify_token, created_at')
        .order('created_at', { ascending: false });

      if (error) setErr(error.message);
      else setRows(data ?? []);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="section">
        <div className="card"><p className="muted">Cargando…</p></div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="section">
        <div className="card"><p className="muted" style={{ color:'#b91c1c' }}>Error: {err}</p></div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="card stack-12">
        <h2 className="h2">Mis Órdenes</h2>
        {rows.length === 0 ? (
          <p className="muted">Aún no tienes órdenes emitidas.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Folio</th>
                  <th>Frecuencia</th>
                  <th>Neto</th>
                  <th>Estado</th>
                  <th style={{ width:120 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.folio}>
                    <td>{r.periodo}</td>
                    <td>{r.folio}</td>
                    <td>{r.frecuencia}</td>
                    <td>{
                      new Intl.NumberFormat('es-GT', { style:'currency', currency:'GTQ' })
                        .format(Number(r.neto ?? 0))
                    }</td>
                    <td>
                      <span className={`badge ${r.estado === 'EMITIDO' ? 'ok' : 'warn'}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <a className="btn" href={`/verify/${r.verify_token}`} target="_blank" rel="noreferrer">Verificar</a>
                        <a className="btn" href={`/api/ordenes/pdf/${r.verify_token}`} target="_blank" rel="noreferrer">PDF</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
