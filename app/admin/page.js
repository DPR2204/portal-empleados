'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

const ESTADOS = ['EMITIDO', 'PAGADO', 'ANULADO'];

export default function AdminPage() {
  const [me, setMe] = useState(null);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null); // verify_token que se está guardando
  const [err, setErr] = useState('');

  // Carga mi rol
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return setErr('No hay sesión');
      const { data: prof } = await supabase
        .from('profiles')
        .select('role, display_name, email')
        .eq('user_id', userData.user.id)
        .single();
      setMe(prof);
    };
    load();
  }, []);

  const buscar = async () => {
    setErr('');
    setRows([]);
    setLoading(true);
    try {
      // Busca por folio (ILIKE) o verify_token exacto (uuid)
      const byToken = /^[0-9a-f-]{36}$/i.test(q.trim());
      let query = supabase
        .from('orden_pago')
        .select('id, folio, periodo, frecuencia, neto, estado, verify_token, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (byToken) {
        query = query.eq('verify_token', q.trim());
      } else if (q.trim()) {
        query = query.ilike('folio', `%${q.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRows(data ?? []);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (row, nuevoEstado) => {
    setErr('');
    setSaving(row.verify_token);
    try {
      const { error } = await supabase
        .from('orden_pago')
        .update({ estado: nuevoEstado })
        .eq('verify_token', row.verify_token);
      if (error) throw error;

      // Refresca en memoria
      setRows(prev =>
        prev.map(r =>
          r.verify_token === row.verify_token ? { ...r, estado: nuevoEstado } : r
        )
      );
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setSaving(null);
    }
  };

  if (!me) {
    return <main className="section"><p>Cargando…</p></main>;
  }
  if (me.role !== 'ADMIN') {
    return (
      <main className="section">
        <div className="card">
          <h2 className="h2">No autorizado</h2>
          <p>Tu rol es <b>{me.role}</b>. Esta vista es solo para <b>ADMIN</b>.</p>
          <Link className="btn" href="/">Volver</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="card stack-16">
        <h2 className="h2">Administración de Órdenes</h2>

        <div className="stack-8">
          <div className="admin-search">
            <input
              className="input"
              type="text"
              placeholder="Buscar por folio (texto) o verify_token (UUID)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
            />
            <button className="btn" onClick={buscar} disabled={loading}>
              {loading ? 'Buscando…' : 'Buscar'}
            </button>
          </div>

          {err && <p className="error">{err}</p>}
        </div>

        {rows.length === 0 ? (
          <p className="muted">Sin resultados.</p>
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
                  <th style={{ width: 220 }}>Actualizar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.verify_token}>
                    <td>{r.periodo}</td>
                    <td className="mono">{r.folio}</td>
                    <td>{r.frecuencia}</td>
                    <td>{new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(r.neto)}</td>
                    <td>
                      <span className={`badge ${r.estado === 'EMITIDO' ? 'ok' : r.estado === 'PAGADO' ? 'paid' : 'warn'}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <select
                          className="input"
                          defaultValue={r.estado}
                          onChange={(e) => actualizarEstado(r, e.target.value)}
                          disabled={saving === r.verify_token}
                        >
                          {ESTADOS.map((e) => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                        <a className="btn ghost" href={`/verify/${r.verify_token}`} target="_blank" rel="noreferrer">
                          Verificar
                        </a>
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
