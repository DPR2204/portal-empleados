'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminComprobantesPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let admin = false;
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        admin = prof?.role === 'ADMIN';
      }
      setIsAdmin(admin);
      setLoading(false);
    })();
  }, []);

  const search = async () => {
    setMsg('');
    setRows([]);

    // Heurística simple: si parece UUID => buscar verify_token
    const isUuid = q && q.length === 36 && q.includes('-');

    if (isUuid) {
      const { data, error } = await supabase
        .from('comprobante')
        .select('id,verify_token,tipo,periodo,fecha,moneda,monto,estado,paid_at, colaborador:colaborador_id(id,nombres,apellidos,email)')
        .eq('verify_token', q)
        .limit(20);
      if (error) { setMsg(error.message); return; }
      setRows(data ?? []);
      return;
    }

    // Si no es UUID: buscar por correo, id de colaborador o texto de periodo
    // Usamos join con la FK para filtrar por email del colaborador
    let query = supabase
      .from('comprobante')
      .select('id,verify_token,tipo,periodo,fecha,moneda,monto,estado,paid_at, colaborador:colaborador_id(id,nombres,apellidos,email)')
      .limit(50)
      .order('fecha', { ascending: false });

    if (q) {
      // si parece UUID de colaborador, filtra por colaborador_id
      if (q.length === 36 && q.includes('-')) {
        query = query.eq('colaborador_id', q);
      } else {
        query = query.ilike('colaborador.email', `%${q}%`);
      }
    }

    const { data, error } = await query;
    if (error) { setMsg(error.message); return; }
    setRows(data ?? []);
  };

  const setEstado = async (id, nuevo) => {
    setMsg('');
    const patch = { estado: nuevo };
    if (nuevo === 'PAGADO') patch.paid_at = new Date().toISOString();

    const { error } = await supabase
      .from('comprobante')
      .update(patch)
      .eq('id', id);

    if (error) { setMsg(error.message); return; }
    await search();
  };

  if (loading) return <main className="section"><div className="card">Cargando…</div></main>;
  if (!isAdmin) return <main className="section"><div className="card">Solo ADMIN.</div></main>;

  return (
    <main className="section">
      <div className="card stack-12">
        <h2 className="h2">Administración de Comprobantes</h2>

        <div className="row gap-8">
          <input className="input" style={{maxWidth: 520}}
                 placeholder="Buscar por verify_token (UUID), correo de colaborador o colaborador_id (UUID)…"
                 value={q} onChange={e=>setQ(e.target.value)} />
          <button className="btn" onClick={search}>Buscar</button>
          {msg && <span className="muted">{msg}</span>}
        </div>

        {rows.length === 0 ? (
          <p className="muted">Sin resultados.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Colaborador</th>
                  <th>Tipo</th>
                  <th>Periodo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th style={{width:220}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.fecha?.slice(0,10)}</td>
                    <td>
                      <div className="stack-2">
                        <b>{r.colaborador?.nombres} {r.colaborador?.apellidos}</b>
                        <span className="muted">{r.colaborador?.email}</span>
                      </div>
                    </td>
                    <td>{r.tipo}</td>
                    <td>{r.periodo || '—'}</td>
                    <td>{new Intl.NumberFormat('es-GT',{style:'currency',currency:r.moneda||'GTQ'}).format(r.monto||0)}</td>
                    <td>
                      <span className={`badge ${r.estado==='PAGADO' ? 'ok' : r.estado==='ANULADO' ? 'warn' : ''}`}>
                        {r.estado}
                      </span>
                      {r.paid_at && <div className="muted" style={{fontSize:12}}>pagado {new Date(r.paid_at).toLocaleString()}</div>}
                    </td>
                    <td>
                      <div className="row gap-8 wrap">
                        <button className="btn" onClick={()=>setEstado(r.id,'PAGADO')}>Marcar PAGADO</button>
                        <button className="btn" onClick={()=>setEstado(r.id,'EMITIDO')}>Volver a EMITIDO</button>
                        <button className="btn" onClick={()=>setEstado(r.id,'ANULADO')}>ANULAR</button>
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
