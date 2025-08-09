// app/admin/page.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [err, setErr] = useState('');

  // filtros
  const [colabId, setColabId] = useState('');
  const [email, setEmail] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const init = async () => {
      setErr('');
      setLoading(true);

      // 1) sesión
      const { data: udata, error: eUser } = await supabase.auth.getUser();
      const user = udata?.user;
      if (eUser || !user) {
        setErr('No hay sesión activa');
        setLoading(false);
        return;
      }

      // 2) role desde profiles
      const { data: prof, error: eProf } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (eProf) {
        setErr(eProf.message);
        setLoading(false);
        return;
      }

      setIsAdmin(prof?.role === 'ADMIN');
      setLoading(false);
    };

    init();
  }, []);

  const buscar = async () => {
    setErr('');
    setRows([]);

    try {
      let targetId = colabId?.trim();

      // Si ponen email, resolvemos el colaborador_id por email
      if (!targetId && email.trim()) {
        const { data: col, error: eCol } = await supabase
          .from('colaborador')
          .select('id')
          .ilike('email', email.trim())
          .maybeSingle();

        if (eCol) throw eCol;
        if (!col) {
          setErr('No existe colaborador con ese email.');
          return;
        }
        targetId = col.id;
        setColabId(col.id);
      }

      if (!targetId) {
        setErr('Ingresa un colaborador_id o un email.');
        return;
      }

      const { data, error } = await supabase
        .from('orden_pago')
        .select('folio, periodo, frecuencia, neto, estado, verify_token, created_at')
        .eq('colaborador_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRows(data ?? []);
    } catch (e) {
      setErr(e.message);
    }
  };

  if (loading) return <div className="section"><p className="muted">Cargando…</p></div>;
  if (!isAdmin) {
    return (
      <div className="section">
        <div className="card">
          <h2>Admin</h2>
          <p className="muted">No tienes permisos de administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="card stack-12">
        <h2>Admin — Historial por colaborador</h2>

        <div className="stack-12" style={{maxWidth: 640}}>
          <label>
            <div className="muted" style={{marginBottom:6}}>colaborador_id</div>
            <input
              placeholder="Ej. 52faadb3-8f33-4f34-8111-62a98b644d51"
              value={colabId}
              onChange={(e) => setColabId(e.target.value)}
            />
          </label>

          <div className="muted" style={{textAlign:'center'}}>— o —</div>

          <label>
            <div className="muted" style={{marginBottom:6}}>Email del colaborador</div>
            <input
              placeholder="persona@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <div className="actions">
            <button className="btn btn-primary" onClick={buscar}>Buscar</button>
            <button className="btn" onClick={()=>{ setRows([]); setErr(''); }}>Limpiar</button>
          </div>
        </div>

        {err && <p style={{color:'#b91c1c'}}>{err}</p>}

        {rows.length > 0 && (
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
                    <td>{new Intl.NumberFormat('es-GT',{style:'currency', currency:'GTQ'}).format(r.neto ?? 0)}</td>
                    <td>
                      <span className={`badge ${r.estado === 'EMITIDO' ? 'ok' : 'warn'}`}>{r.estado}</span>
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

        {rows.length === 0 && !err && (
          <p className="muted">Sin resultados. Ingresa un <strong>colaborador_id</strong> o un <strong>email</strong> y pulsa “Buscar”.</p>
        )}
      </div>
    </div>
  );
}
