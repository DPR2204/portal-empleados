'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function NuevaOrden() {
  const [email, setEmail] = useState('');
  const [frecuencia, setFrecuencia] = useState('MENSUAL');
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth()+1); // 1..12
  const [quincena, setQuincena] = useState('Q1');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [dias, setDias] = useState('');
  const [otrosDesc, setOtrosDesc] = useState('');
  const [resp, setResp] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''));
  }, []);

  const generar = async (e) => {
    e.preventDefault();
    setErr(''); setResp(null);
    const payload = { emailColaborador: email, frecuencia, anio, mes, quincena, inicio, fin, dias_laborados: dias, otros_descuentos: otrosDesc };
    const r = await fetch('/api/ordenes/generar', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error || 'Error'); return; }
    setResp(j);
  };

  return (
    <main>
      <h2>Nueva Orden</h2>
      <form onSubmit={generar} style={{ display:'grid', gap:12, maxWidth:520 }}>
        <div><label>Tu correo</label><input value={email} readOnly style={{ width:'100%' }} /></div>
        <div>
          <label>Frecuencia</label>
          <select value={frecuencia} onChange={e=>setFrecuencia(e.target.value)}>
            <option value="MENSUAL">MENSUAL</option>
            <option value="QUINCENAL">QUINCENAL</option>
            <option value="DIAS">DÍAS</option>
          </select>
        </div>
        {frecuencia === 'MENSUAL' && (
          <div style={{ display:'flex', gap:8 }}>
            <div><label>Año</label><input type="number" value={anio} onChange={e=>setAnio(e.target.value)} /></div>
            <div><label>Mes (1-12)</label><input type="number" value={mes} onChange={e=>setMes(e.target.value)} /></div>
            <small>Se paga el día 1 del mes siguiente.</small>
          </div>
        )}
        {frecuencia === 'QUINCENAL' && (
          <div style={{ display:'flex', gap:8, alignItems:'end' }}>
            <div><label>Año</label><input type="number" value={anio} onChange={e=>setAnio(e.target.value)} /></div>
            <div><label>Mes</label><input type="number" value={mes} onChange={e=>setMes(e.target.value)} /></div>
            <div>
              <label>Quincena</label>
              <select value={quincena} onChange={e=>setQuincena(e.target.value)}>
                <option value="Q1">Q1 (1–15)</option>
                <option value="Q2">Q2 (16–fin)</option>
              </select>
            </div>
          </div>
        )}
        {frecuencia === 'DIAS' && (
          <div style={{ display:'grid', gap:8 }}>
            <div><label>Inicio</label><input type="date" value={inicio} onChange={e=>setInicio(e.target.value)} /></div>
            <div><label>Fin</label><input type="date" value={fin} onChange={e=>setFin(e.target.value)} /></div>
            <div><label>Días laborados</label><input type="number" step="0.5" value={dias} onChange={e=>setDias(e.target.value)} /></div>
          </div>
        )}
        <div><label>Otros descuentos (opcional)</label><input type="number" step="0.01" value={otrosDesc} onChange={e=>setOtrosDesc(e.target.value)} /></div>
        <button type="submit" style={{ padding:10, border:'1px solid #ccc', borderRadius:8 }}>Generar</button>
      </form>

      {err && <p style={{ color:'red', marginTop:12 }}>Error: {err}</p>}
      {resp && (
        <div style={{ marginTop:16, border:'1px solid #eee', padding:12 }}>
          <h3>Orden creada</h3>
          <p><strong>Folio:</strong> {resp.folio}</p>
          <p><strong>Periodo:</strong> {resp.periodo}</p>
          <p><strong>Bruto:</strong> Q {resp.bruto} | <strong>Adelantos:</strong> Q {resp.adelantos} | <strong>Neto:</strong> Q {resp.neto}</p>
          <p><a href={`/verify/${resp.verify_token}`} target="_blank">Verificar (link con token)</a></p>
        </div>
      )}
    </main>
  );
}
