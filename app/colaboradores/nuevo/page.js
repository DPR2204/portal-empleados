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
  <div className="form-card">
    <h2 className="form-title">Nuevo colaborador</h2>

    <form onSubmit={handleSubmit}>
      {/* Grid de 2 columnas en desktop */}
      <div className="form-grid cols-2">
        <div className="field">
          <label>Nombres</label>
          <input name="nombres" placeholder="Nombres" required />
        </div>
        <div className="field">
          <label>Apellidos</label>
          <input name="apellidos" placeholder="Apellidos" required />
        </div>

        <div className="field">
          <label>DPI</label>
          <input name="dpi" placeholder="DPI" />
        </div>
        <div className="field">
          <label>Correo</label>
          <input type="email" name="email" placeholder="correo@dominio.com" required />
        </div>

        <div className="field">
          <label>Teléfono</label>
          <input type="tel" name="telefono" placeholder="502..." />
        </div>
        <div className="field">
          <label>Puesto</label>
          <input name="puesto" placeholder="Puesto" />
        </div>

        <div className="field">
          <label>Sucursal</label>
          <input name="sucursal" placeholder="Sucursal" />
        </div>
        <div className="field">
          <label>Sueldo base (mensual)</label>
          <input type="number" step="0.01" name="sueldo_base" placeholder="0.00" />
        </div>

        <div className="field">
          <label>Frecuencia</label>
          <select name="frecuencia" defaultValue="MENSUAL">
            <option value="MENSUAL">Mensual</option>
            <option value="QUINCENAL">Quincenal</option>
            <option value="SEMANAL">Semanal</option>
            <option value="DIARIA">Diaria</option>
          </select>
        </div>
        <div className="field">
          <label>Tarifa diaria</label>
          <input type="number" step="0.01" name="tarifa_diaria" placeholder="0.00" />
        </div>

        <div className="field">
          <label>Fecha de ingreso</label>
          <input type="date" name="fecha_ingreso" />
        </div>
        <div className="field" style={{display:'flex', alignItems:'end'}}>
          <label className="switch">
            <input type="checkbox" name="activo" defaultChecked />
            <span>Activo</span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Guardar</button>
      </div>
    </form>
  </div>
</main>

