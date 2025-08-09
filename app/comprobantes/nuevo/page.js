'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function NuevoComprobantePage() {
  const [email, setEmail] = useState('');
  const [colab, setColab] = useState(null);
  const [colabId, setColabId] = useState('');
  const [tipo, setTipo] = useState('BONO');
  const [monto, setMonto] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [fecha, setFecha] = useState('');
  const [concepto, setConcepto] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [newToken, setNewToken] = useState('');
  const [newFolio, setNewFolio] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // buscar colaborador por correo
  const buscar = async () => {
    setErr(''); setOkMsg('');
    if (!email) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('email, display_name, colaborador_id')
      .ilike('email', email)
      .limit(1);
    if (error) { setErr(error.message); return; }
    const p = data?.[0];
    if (!p || !p.colaborador_id) {
      setErr('No se encontró colaborador vinculado a ese correo.');
      setColab(null); setColabId('');
      return;
    }
    setColab(p);
    setColabId(p.colaborador_id);
  };

  const guardar = async () => {
    try {
      setLoading(true); setErr(''); setOkMsg('');
      if (!colabId) { setErr('Selecciona un colaborador.'); return; }
      if (!monto) { setErr('Ingresa el monto.'); return; }

      // insertar
      const { data, error } = await supabase
        .from('comprobante')
        .insert({
          colaborador_id: colabId,
          tipo,
          concepto: concepto || null,
          monto: Number(monto),
          periodo: periodo || null,
          fecha: fecha || null,
        })
        .select('folio, verify_token')
        .single();

      if (error) throw error;

      setNewToken(data.verify_token);
      setNewFolio(data.folio);
      setOkMsg('Comprobante emitido.');

    } catch (e) {
      setErr(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card stack-16">
      <h2 className="h2">Nuevo Comprobante</h2>

      <div className="stack-8">
        <label>Buscar colaborador por correo</label>
        <div className="row gap-8">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="input"
            style={{ flex: 1 }}
          />
          <button className="btn" onClick={buscar}>Buscar</button>
        </div>
        {colab && (
          <p className="muted">
            Encontrado: <strong>{colab.display_name}</strong> — {colab.email}
          </p>
        )}

        <input className="input" value={colabId} readOnly placeholder="Colaborador ID" />

        <div className="row gap-8">
          <div className="col">
            <label>Tipo</label>
            <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="BONO">BONO</option>
              <option value="VACACIONES">VACACIONES</option>
              <option value="AGUINALDO">AGUINALDO</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>
          <div className="col">
            <label>Monto (GTQ)</label>
            <input className="input" type="number" value={monto} onChange={e => setMonto(e.target.value)} />
          </div>
        </div>

        <div className="row gap-8">
          <div className="col">
            <label>Periodo (opcional)</label>
            <input className="input" placeholder="ej. 2025-08" value={periodo} onChange={e => setPeriodo(e.target.value)} />
          </div>
          <div className="col">
            <label>Fecha (opcional)</label>
            <input className="input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
        </div>

        <label>Concepto (opcional)</label>
        <input className="input" placeholder="Descripción breve" value={concepto} onChange={e => setConcepto(e.target.value)} />

        <div className="row gap-8">
          <button className="btn" onClick={guardar} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>

          {/* Botón PDF cuando ya tenemos folio */}
          {newFolio && (
            <a className="btn" href={`/api/comprobantes/pdf/${encodeURIComponent(newFolio)}`} target="_blank" rel="noreferrer">
              Ver PDF
            </a>
          )}
        </div>

        {okMsg && (
          <p className="ok">
            {okMsg} Folio: <strong>{newFolio}</strong> · Token: <code>{newToken}</code>
          </p>
        )}
        {err && <p className="error">{err}</p>}
      </div>
    </div>
  );
}
