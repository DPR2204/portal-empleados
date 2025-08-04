'use client';
import { useState } from 'react';

export default function NuevoColaborador() {
  const [campos, setCampos] = useState({
    nombres: '', apellidos: '', email: '',
    sueldo_base: '', tarifa_diaria: ''
  });
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');

  const cambia = e => setCampos({ ...campos, [e.target.name]: e.target.value });

  const guardar = async e => {
    e.preventDefault();
    setMsg(''); setErr('');
    const r = await fetch('/api/colaboradores/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campos)
    });
    const j = await r.json();
    if (!r.ok) setErr(j.error || 'Error');
    else { setMsg('Colaborador creado ✔'); setCampos({nombres:'',apellidos:'',email:'',sueldo_base:'',tarifa_diaria:''}); }
  };

  return (
    <main>
      <h2>Nuevo colaborador</h2>
      <form onSubmit={guardar} style={{display:'grid',gap:12,maxWidth:420}}>
        <input name="nombres" placeholder="Nombres" value={campos.nombres} onChange={cambia} required />
        <input name="apellidos" placeholder="Apellidos" value={campos.apellidos} onChange={cambia} required />
        <input name="email" type="email" placeholder="Correo" value={campos.email} onChange={cambia} required />
        <input name="sueldo_base" type="number" step="0.01" placeholder="Sueldo base (mensual)" value={campos.sueldo_base} onChange={cambia} required />
        <input name="tarifa_diaria" type="number" step="0.01" placeholder="Tarifa diaria" value={campos.tarifa_diaria} onChange={cambia} required />
        <button>Guardar</button>
      </form>
      {err && <p style={{color:'red'}}>{err}</p>}
      {msg && <p style={{color:'green'}}>{msg}</p>}
    </main>
  );
}
