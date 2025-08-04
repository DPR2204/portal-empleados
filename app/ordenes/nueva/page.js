// app/ordenes/nueva/page.js
'use client';

import { useState } from 'react';

export default function NuevaOrden() {
  const [campos, setCampos] = useState({
    idPublico: '',
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
    setMsg('');
    setErr('');

    // Ajustamos tipos numéricos
    const payload = {
      ...campos,
      anio: campos.anio ? +campos.anio : undefined,
      mes: campos.mes ? +campos.mes : undefined,
      dias_laborados: campos.dias_laborados
        ? +campos.dias_laborados
        : undefined,
      otros_descuentos: campos.otros_descuentos
        ? +campos.otros_descuentos
        : undefined,
    };

    // 1️⃣ Verificamos en consola que el submit ocurre y qué payload enviamos
    console.log('🔥 [NuevaOrden] submit payload →', payload);

    const res = await fetch('/api/ordenes/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // 2️⃣ Vemos el status de la respuesta
    console.log('🌐 [NuevaOrden] POST status →', res.status);

    const j = await res.json();

    // 3️⃣ Y el cuerpo de la respuesta
    console.log('📣 [NuevaOrden] API response →', j);

    if (!res.ok) {
      setErr(j.error || 'Error al generar');
    } else {
      setMsg(`✔ Orden emitida: ${j.folio}`);
    }
  };

  return (
    <main style={{ padding: 16, maxWidth: 480 }}>
      <h2>Nueva Orden de Pago</h2>
      <form
        onSubmit={guardar}
        style={{ display: 'grid', gap: 12, marginTop: 16 }}
      >
        {/* 1. ID público */}
        <input
          name="idPublico"
          placeholder="ID Público del colaborador"
          value={campos.idPublico}
          onChange={cambia}
          required
        />

        {/* 2. Frecuencia */}
        <select
          name="frecuencia"
          value={campos.frecuencia}
          onChange={cambia}
        >
          <option value="MENSUAL">Mensual</option>
          <option value="QUINCENAL">Quincenal</option>
          <option value="DIAS">Por días</option>
        </select>

        {/* 3. Año y mes / quincena */}
        {campos.frecuencia !== 'DIAS' && (
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
              placeholder="Mes (1–12)"
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
                <option value="Q1">Q1 (días 1–15)</option>
                <option value="Q2">Q2 (días 16–fin)</option>
              </select>
            )}
          </>
        )}

        {/* 4. Rango de días */}
        {campos.frecuencia === 'DIAS' && (
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

        {/* 5. Otros descuentos */}
        <input
          name="otros_descuentos"
          type="number"
          step="0.01"
          placeholder="Otros descuentos (opcional)"
          value={campos.otros_descuentos}
          onChange={cambia}
        />

        <button type="submit" style={{ padding: '8px 16px' }}>
          Generar
        </button>
      </form>

      {err && (
        <p style={{ color: 'red', marginTop: 12 }}>Error: {err}</p>
      )}
      {msg && (
        <p style={{ color: 'green', marginTop: 12 }}>{msg}</p>
      )}
    </main>
  );
}
