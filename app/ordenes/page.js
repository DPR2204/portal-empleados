'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient'; // <-- ajusta a tu ruta si hiciera falta

export default function OrdenesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setErr('');
        setLoading(true);

        // Usuario logueado
        const { data: usr, error: eUsr } = await supabase.auth.getUser();
        if (eUsr) throw eUsr;
        if (!usr?.user) {
          setErr('No hay sesión activa');
          setLoading(false);
          return;
        }

        // Intento de “link” por email (si tu función existe, ignora errores)
        try { await supabase.rpc('link_me'); } catch {}

        // Busca colaborador por este usuario (ajusta a tu estrategia si usas email)
        const { data: col, error: eCol } = await supabase
          .from('colaborador')
          .select('id')
          .eq('email', usr.user.email)  // si ya usas auth_user_id, sustitúyelo por eso
          .maybeSingle();
        if (eCol) throw eCol;
        if (!col) {
          setErr('Colaborador desconocido');
          setLoading(false);
          return;
        }

        // Órdenes del colaborador
        const { data, error } = await supabase
          .from('orden_pago')
          .select('folio, periodo, frecuencia, neto, estado, verify_token, created_at')
          .eq('colaborador_id', col.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setRows(data ?? []);
      } catch (e) {
        setErr(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = rows.filter(r =>
    (r.folio ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (r.periodo ?? '').toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <main className="section"><p>Cargando órdenes…</p></main>;
  if (err)     return <main className="section"><p style={{color:'#e11d48'}}>Error: {err}</p></main>;

  return (
    <main className="section">
      <div className="card">
        <div className="head">
          <h2 className="h2">Mis Órdenes</h2>
          <span className="count">{rows.length} registro{rows.length===1?'':'s'}</span>
        </div>

        {/* Toolbar con buscador */}
        <div className="toolbar">
          <input
            className="input"
            placeholder="Buscar por folio o periodo…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty">Sin resultados. Prueba con otro folio o periodo.</div>
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
                {filtered.map(r => (
                  <tr key={r.folio}>
                    <td>{r.periodo}</td>
                    <td>{r.folio}</td>
                    <td>{r.frecuencia}</td>
                    <td>{new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ'}).format(Number(r.neto||0))}</td>
                    <td>
                      <span className={`badge ${r.estado === 'EMITIDO' ? 'ok' : 'warn'}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <Link className="btn ghost" href={`/verify/${r.verify_token}`} target="_blank">Verificar</Link>
                        <a className="btn ghost" href={`/api/ordenes/pdf/${r.verify_token}`} target="_blank" rel="noreferrer">PDF</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estilos embebidos para que veas el cambio YA */}
      <style jsx global>{`
        :root{
          --brand:#ff0000; --brand-50:rgba(255,0,0,.12);
          --text:#0f172a; --muted:#64748b; --border:#e5e7eb;
          --ok:#059669; --warn:#b45309;
          --bg:#ffffff;
        }
        body{ background:#fff; color:var(--text); }

        .section{ padding:32px 0; }
        .card{ padding:24px; border-radius:16px; background:var(--bg);
               box-shadow:0 10px 20px rgba(0,0,0,.04); }
        .h2{ font-size:22px; font-weight:700; letter-spacing:-.01em; margin:0; }
        .head{ display:flex; align-items:baseline; gap:12px; justify-content:space-between; margin-bottom:8px; }
        .count{ font-size:12px; color:var(--muted); }

        .toolbar{ display:flex; gap:12px; align-items:center; margin:12px 0 16px; flex-wrap:wrap; }
        .input{ height:40px; padding:0 12px; border:1px solid var(--border); border-radius:10px; min-width:260px; outline:0; }
        .input:focus{ border-color:var(--brand); box-shadow:0 0 0 4px var(--brand-50); }

        .table-wrap{ overflow:auto; border:1px solid var(--border); border-radius:14px; }
        .table{ width:100%; border-collapse:separate; border-spacing:0; min-width:760px; }
        .table thead th{ background:#fafafa; position:sticky; top:0; z-index:1;
                         padding:14px 16px; border-bottom:1px solid var(--border); text-align:left; }
        .table tbody td{ padding:14px 16px; border-bottom:1px solid var(--border); }
        .table tbody tr:nth-child(even){ background:#fcfcfc; }
        .table tbody tr:hover{ background:#f8fafc; }

        .badge{ display:inline-flex; align-items:center; gap:6px;
                padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; border:1px solid transparent; }
        .badge.ok{ background:#ecfdf5; color:var(--ok); border-color:#bbf7d0; }
        .badge.warn{ background:#fff7ed; color:var(--warn); border-color:#fed7aa; }

        .actions{ display:flex; gap:8px; flex-wrap:wrap; }
        .btn{ height:34px; padding:0 12px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; font-weight:600; }
        .btn.ghost{ background:#fff; border:1px solid var(--border); }
        .btn.ghost:hover{ border-color:var(--brand); color:var(--brand); }

        .empty{ text-align:center; padding:32px 8px; color:var(--muted); }
      `}</style>
    </main>
  );
}
