'use client';

import { useState } from 'react';

export default function NuevoColaborador() {
  const [campos, setCampos] = useState({
    nombres: '',
    apellidos: '',
    dpi: '',
    email: '',
    telefono: '',
    puesto: '',
    sucursal: '',
    sueldo_base: '',
    frecuencia_default: 'MENSUAL',
    tarifa_diaria: '',
    fecha_ingreso: '',
    estado: true,
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const cambia = (e) => {
    const { name, value, type, checked } = e.target;
    setCampos({
      ...campos,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');

    // Ajustar numéricos
    const payload = {
      ...campos,
      sueldo_base: campos.sueldo_base ? +campos.sueldo_base : undefined,
      tarifa_diaria: campos.tarifa_diaria ? +campos.tarifa_diaria : undefined,
      fecha_ingreso: campos.fecha_ingreso || undefined,
      estado: Boolean(campos.estado),
    };

    const res = await fetch('/api/colaboradores/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const j = await res.json();
    if (!res.ok) {
      setErr(j.error || 'Error al crear colaborador');
    } else {
      setMsg(`✔ Colaborador creado. ID público: ${j.id_publico}`);
      // Limpiar formulario
      setCampos({
        nombres: '',
        apellidos: '',
        dpi: '',
        email: '',
        telefono: '',
        puesto: '',
        sucursal: '',
        sueldo_base: '',
        frecuencia_default: 'MENSUAL',
        tarifa_diaria: '',
        fecha_ingreso: '',
        estado: true,
      });
    }
  };

  return (
    <main>
      <h2>Nuevo colaborador</h2>

      <form
        onSubmit={guardar}
        style={{ display: 'grid', gap: 12, maxWidth: 480 }}
      >
        <input
          name="nombres"
          placeholder="Nombres"
          value={campos.nombres}
          onChange={cambia}
          required
        />
        <input
          name="apellidos"
          placeholder="Apellidos"
          value={campos.apellidos}
          onChange={cambia}
          required
        />
        <input
          name="dpi"
          placeholder="DPI"
          value={campos.dpi}
          onChange={cambia}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Correo"
          value={campos.email}
          onChange={cambia}
          required
        />
        <input
          name="telefono"
          placeholder="Teléfono"
          value={campos.telefono}
          onChange={cambia}
        />
        <input
          name="puesto"
          placeholder="Puesto"
          value={campos.puesto}
          onChange={cambia}
        />
        <input
          name="sucursal"
          placeholder="Sucursal"
          value={campos.sucursal}
          onChange={cambia}
        />
        <input
          name="sueldo_base"
          type="number"
          step="0.01"
          placeholder="Sueldo base (mensual)"
          value={campos.sueldo_base}
          onChange={cambia}
          required
        />
        <select
          name="frecuencia_default"
          value={campos.frecuencia_default}
          onChange={cambia}
        >
          <option value="MENSUAL">Mensual</option>
          <option value="QUINCENAL">Quincenal</option>
          <option value="DIAS">Por días</option>
        </select>
        <input
          name="tarifa_diaria"
          type="number"
          step="0.01"
          placeholder="Tarifa diaria"
          value={campos.tarifa_diaria}
          onChange={cambia}
        />
        <input
          name="fecha_ingreso"
          type="date"
          placeholder="Fecha de ingreso"
          value={campos.fecha_ingreso}
          onChange={cambia}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            name="estado"
            type="checkbox"
            checked={campos.estado}
            onChange={cambia}
          />
          Activo
        </label>

        <button type="submit" style={{ padding: '8px 16px' }}>
          Guardar
        </button>
      </form>

      {err && <p style={{ color: 'red' }}>{err}</p>}
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
    </main>
  );
}
