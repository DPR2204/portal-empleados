'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient'; // OJO: ruta correcta (dos niveles)

export default function NuevoColaboradorPage() {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    dpi: '',
    email: '',
    telefono: '',
    puesto: '',
    sucursal: '',
    sueldo_base_mensual: '',
    frecuencia: 'MENSUAL',
    tarifa_diaria: '',
    fecha_ingreso: '',
    activo: true,
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setOk(false);
    setLoading(true);
    try {
      const payload = {
        nombres: form.nombres || null,
        apellidos: form.apellidos || null,
        dpi: form.dpi || null,
        email: form.email || null,
        telefono: form.telefono || null,
        puesto: form.puesto || null,
        sucursal: form.sucursal || null,
        sueldo_base_mensual: form.sueldo_base_mensual
          ? Number(form.sueldo_base_mensual)
          : null,
        frecuencia: form.frecuencia || null,
        tarifa_diaria: form.tarifa_diaria ? Number(form.tarifa_diaria) : null,
        fecha_ingreso: form.fecha_ingreso || null,
        activo: !!form.activo,
      };

      const { error } = await supabase.from('colaborador').insert(payload);
      if (error) throw error;

      setOk(true);
      setForm((f) => ({
        ...f,
        nombres: '',
        apellidos: '',
        dpi: '',
        email: '',
        telefono: '',
        puesto: '',
        sucursal: '',
        sueldo_base_mensual: '',
        tarifa_diaria: '',
        fecha_ingreso: '',
      }));
    } catch (e) {
      setErr(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section">
      <div className="card stack-16">
        <h2 className="h2">Nuevo colaborador</h2>

        <form className="form" onSubmit={onSubmit}>
          <div className="grid-2">
            <div className="field">
              <label>Nombres</label>
              <input
                name="nombres"
                value={form.nombres}
                onChange={onChange}
                placeholder="Ej. Ana María"
                required
              />
            </div>
            <div className="field">
              <label>Apellidos</label>
              <input
                name="apellidos"
                value={form.apellidos}
                onChange={onChange}
                placeholder="Ej. López Pérez"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>DPI</label>
              <input
                name="dpi"
                value={form.dpi}
                onChange={onChange}
                placeholder="0000 00000 0000"
              />
            </div>
            <div className="field">
              <label>Correo</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="persona@correo.com"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={onChange}
                placeholder="+502 ..."
              />
            </div>
            <div className="field">
              <label>Puesto</label>
              <input
                name="puesto"
                value={form.puesto}
                onChange={onChange}
                placeholder="Cajero/a"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Sucursal</label>
              <input
                name="sucursal"
                value={form.sucursal}
                onChange={onChange}
                placeholder="Antigua"
              />
            </div>
            <div className="field">
              <label>Sueldo base (mensual)</label>
              <input
                inputMode="decimal"
                name="sueldo_base_mensual"
                value={form.sueldo_base_mensual}
                onChange={onChange}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Frecuencia</label>
              <select
                name="frecuencia"
                value={form.frecuencia}
                onChange={onChange}
              >
                <option value="MENSUAL">Mensual</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="SEMANAL">Semanal</option>
                <option value="DIARIA">Diaria</option>
              </select>
            </div>
            <div className="field">
              <label>Tarifa diaria</label>
              <input
                inputMode="decimal"
                name="tarifa_diaria"
                value={form.tarifa_diaria}
                onChange={onChange}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Fecha de ingreso</label>
              <input
                type="date"
                name="fecha_ingreso"
                value={form.fecha_ingreso}
                onChange={onChange}
              />
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'end' }}>
              <label className="switch">
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={onChange}
                />
                Activo
              </label>
            </div>
          </div>

          <div className="actions">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <Link href="/colaboradores" className="btn">
              Cancelar
            </Link>
          </div>

          {err ? <p className="muted" style={{ color: '#b91c1c' }}>{err}</p> : null}
          {ok ? <p className="muted" style={{ color: '#065f46' }}>Colaborador creado.</p> : null}
        </form>
      </div>
    </main>
  );
}
