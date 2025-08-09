'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

const isUUID = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
const isEmail = (s) => /\S+@\S+\.\S+/.test(s.trim());

export default function AdminPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function search() {
    setErr('');
    const term = q.trim();
    if (!term) {
      setRows([]);
      return;
    }
    setLoading(true);

    // base select (sin anidar)…
    let query = supabase
      .from('orden_pago')
      .select(
        `
        id, folio, periodo, frecuencia, neto, estado, verify_token, created_at,
        colaborador_id
      `
      )
      .order('created_at', { ascending: false })
      .limit(50);

    // Si es UUID: buscar por verify_token o colaborador_id
    if (isUUID(term)) {
      query = query.or(`verify_token.eq.${term},colaborador_id.eq.${term}`);
    }
    // Si parece correo: pedimos además el email del colaborador y filtramos por él
    else if (isEmail(term)) {
      query = supabase
        .from('orden_pago')
        .select(
          `
          id, folio, periodo, frecuencia, neto, estado, verify_token, created_at, colaborador_id,
          colaborador:colaborador_id ( email )
        `
        )
        .ilike('colaborador.email', `%${term}%`)
        .order('created_at', { ascending: false })
        .limit(50);
    }
    // En cualquier otro caso: buscar por folio (texto)
    else {
      query = query.ilike('folio', `%${term}%`);
    }

    const { data, error } = await query;
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  }

  async function setEstado(id, nuevo) {
    setErr('');
    const { error } = await supabase
      .from('orden_pago')
      .update({ estado: nuevo })
      .eq('id', id);
    if (error) return setErr(error.message);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, estado: nuevo } : r)));
  }

  return (
    <main className="section">
      <div className="card stack-12">
        <h2 className="h2">Administración de Órdenes</h2>

        <div className="row" style={{ display: 'flex', gap: 12 }}>
          <input
            className="input"
            placeholder="Buscar por folio, verify_token (UUID), colaborador_id (UUID) o correo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            style={{ flex: 1 }}
          />
          <button className="btn" onClick={search} disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {err && <p className="error" style={{ color: '#b91c1c' }}>{err}</p>}

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
                  <th style={{ width: 240 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.periodo}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{r.folio}</span>
                        {/* si vino el email anidado, lo mostramos */}
                        {r.colaborador?.email && (
                          <span className="muted" style={{ fontSize: 12 }}>
                            {r.colaborador.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{r.frecuencia}</td>
                    <td>
                      {new Intl.NumberFormat('es-GT', {
                        style: 'currency',
                        currency: 'GTQ',
                      }).format(r.neto)}
                    </td>
                    <td>
                      <span className={`badge ${r.estado === 'PAGADO' ? 'ok' : 'warn'}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        {r.estado !== 'PAGADO' && (
                          <button className="btn" onClick={() => setEstado(r.id, 'PAGADO')}>
                            Marcar pagado
                          </button>
                        )}
                        <a
                          className="btn"
                          href={`/verify/${r.verify_token}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Verificar
                        </a>
                        <a
                          className="btn"
                          href={`/api/ordenes/pdf/${r.verify_token}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          PDF
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
