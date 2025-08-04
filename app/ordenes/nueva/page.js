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
  const [resultado, setResultado] = useState(null);
  const [err, setErr] = useState('');

  const cambia = (e) =>
    setCampos({ ...campos, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setErr('');
    setResultado(null);

    // Prepara payload
    const payload = {
      ...campos,
      anio: campos.anio ? +campos.anio : undefined,
      mes: campos.mes ? +campos.mes : undefined,
      dias_laborados: campos.dias_laborados ? +campos.dias_laborados : undefined,
      otros_descuentos: campos.otros_descuentos ? +campos.otros_descuentos : undefined,
    };

    const res = await fetch('/api/ordenes/generar', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await res.json();

    if (!res.ok) {
      setErr(j.error || 'Error al generar');
    } else {
      // guarda folio y token para mostrar enlace
      setResultado({ folio: j.folio, token: j.verify_token });
    }
  };

  return (
    <main>
      <h2>Nueva Orden de Pago</h2>
      <form onSubmit={guardar} style={{ display:'grid', gap:12, maxWidth:400 }}>
        <input
          name="idPublico"
          placeholder="ID Público del colaborador"
          value={campos.idPublico}
          onChange={cambia}
          required
        />

        <select name="frecuencia" value={campos.frecuencia} onChange={cambia}>
          <option value="MENSUAL">Mensual</option>
          <option value="QUINCENAL">Quincenal</option>
          <option value="DIAS">Por días</option>
        </select>

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
              <select name="quincena" value={campos.quincena} onChange={cambia}>
                <option value="Q1">Q1 (1–15)</option>
                <option value="Q2">Q2 (16–fin)</option>
              </select>
            )}
          </>
        )}

        {campos.frecuencia === 'DIAS' && (
          <>
            <input name="inicio" type="date" value={campos.inicio} onChange={cambia} required/>
            <input name="fin"    type="date" value={campos.fin}    onChange={cambia} required/>
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

      {err && <p style={{ color:'red' }}>Error: {err}</p>}

      {resultado && (
        <div style={{ marginTop:16, color:'green' }}>
          <p>✔ Orden emitida: <strong>{resultado.folio}</strong></p>
          <p>
            <a
              href={`/api/ordenes/pdf/${resultado.token}`}
              target="_blank"
              style={{ textDecoration:'underline' }}
            >
              Ver / Descargar PDF
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
