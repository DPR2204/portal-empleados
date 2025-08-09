// app/ordenes/page.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function OrdenesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const run = async () => {
      setErr('');
      setLoading(true);

      // 1) usuario actual
      const { data: userData, error: eUser } = await supabase.auth.getUser();
      const user = userData?.user;
      if (eUser || !user) {
        setErr('No hay sesión activa');
        setLoading(false);
        return;
      }

      // 2) (opcional) asegurar link por email si faltó
      try { await supabase.rpc('link_me'); } catch {}

      // 3) buscar órdenes del colaborador (RLS ya filtra por auth.uid())
      const { data, error } = await supabase
        .from('orden_pago')
        .select('folio, periodo, frecuencia, neto, estado, verify_token, created_at')
        .order('created_at', { ascending: false });

      if (error) setErr(error.message);
      else setRows(data ?? []);

      setLoading(false);
    };
    run();
  }, []);

  if (loading) return <div className="section"><p className="muted">Cargando…</p></div>;
  if (err) return <div className="section"><p style={{color:'#b91c1c'}}>Error: {err}</p></div>;

  return (
    <div className="section">
      <div className="card stack-12">
        <h2>Mis Órdenes</h2>

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
                  <th style={{width:160}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.folio}>
                    <td>{r.periodo}</td>
                    <td>{r.folio}</td>
                    <td>{r.frecuencia}</td>
                    <td>
                      {new Intl.NumberFormat('es-GT',{ style:'currency', currency:'GTQ'}).format(r.neto ?? 0)}
                    </td>
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
    </div>
  );
}
