// app/ordenes/nueva/page.js
'use client';
import { useState } from 'react';

export default function NuevaOrden() {
  const [campos, setCampos] = useState({
    emailColaborador: '',
    frecuencia: 'MENSUAL',
    anio: '',
    mes: '',
    quincena: 'Q1',
    inicio: '',
    fin: '',
    dias_laborados: '',
    otros_descuentos: '',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const cambia = (e) =>
    setCampos({ ...campos, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    // Convierte strings a números donde corresponda
    const payload = {
      ...campos,
      anio: campos.anio ? +campos.anio : undefined,
      mes: campos.mes ? +campos.mes : undefined,
      dias_laborados: campos.dias_laborados ? +campos.dias_laborados : undefined,
      otros_descuentos: campos.otros_descuentos
        ? +campos.otros_descuentos
        : undefined,
    };
    const r = await fetch('/api/ordenes/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error || 'Error al generar');
      return;
    }
    setMsg(`✔️ Orden emitida — Folio: ${j.folio}`);
  };

  return (
    <main>
      <h2>Nueva Orden de Pago</h2>
      <form onSubmit={guardar} style={{ display:'grid', gap:12, maxWidth:420 }}>
        <input
          name="emailColaborador"
          type="email"
          placeholder="Correo del colaborador"
          value={campos.emailColaborador}
          onChange={cambia}
          required
        />

        <select name="frecuencia" value={campos.frecuencia} onChange={cambia}>
          <option value="MENSUAL">Mensual</option>
          <option value="QUINCENAL">Quincenal</option>
          <option value="DIAS">Por días</option>
        </select>

        {campos.frecuencia !== 'DIAS' ? (
          <>
            <input
              name="anio"
              type="number"
              placeholder="Año"
              value={campos.anio}
              onChange={cambia}
              required
            />
            <input
              name="mes"
              type="number"
              placeholder="Mes (1-12)"
              value={campos.mes}
              onChange={cambia}
              required
            />
            {campos.frecuencia === 'QUINCENAL' && (
              <select
                name="quincena"
                value={campos.quincena}
                onChange={cambia}
              >
                <option value="Q1">Q1 (1–15)</option>
                <option value="Q2">Q2 (16–fin)</option>
              </select>
            )}
          </>
        ) : (
          <>
            <input
              name="inicio"
              type="date"
              value={campos.inicio}
              onChange={cambia}
              required
            />
            <input
              name="fin"
              type="date"
              value={campos.fin}
              onChange={cambia}
              required
            />
            <input
              name="dias_laborados"
              type="number"
              placeholder="Días laborados"
              value={campos.dias_laborados}
              onChange={cambia}
              required
            />
          </>
        )}

        <input
          name="otros_descuentos"
          type="number"
          step="0.01"
          placeholder="Otros descuentos (opcional)"
          value={campos.otros_descuentos}
          onChange={cambia}
        />

        <button type="submit">Generar</button>
      </form>

      {err &&   <p style={{ color:'red' }}>{err}</p>}
      {msg &&   <p style={{ color:'green' }}>{msg}</p>}
    </main>
  );
}
