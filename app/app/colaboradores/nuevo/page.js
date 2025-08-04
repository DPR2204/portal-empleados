'use client';
import { useState } from 'react';

export default function NuevoColaborador() {
  const [form, setForm] = useState({
    email:'', nombres:'', apellidos:'', sueldo_base:'', tarifa_diaria:''
  });
  const [resp, setResp] = useState(null);
  const [err,  setErr]  = useState('');

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const crear = async e => {
    e.preventDefault(); setErr(''); setResp(null);
    const r = await fetch('/api/colaboradores/crear', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(form)
    });
    const j = await r.json();
    if (!r.ok) { setErr(j.error||'Error'); return; }
    setResp(j);
  };

  return (
    <main style={{ maxWidth:500 }}>
      <h2>Nuevo Colaborador</h2>
      <form onSubmit={crear} style={{ display:'grid', gap:10 }}>
        <input name="email"        placeholder="Correo"        value={form.email}        onChange={onChange} required/>
        <input name="nombres"      placeholder="Nombres"       value={form.nombres}      onChange={onChange}/>
        <input name="apellidos"    placeholder="Apellidos"     value={form.apellidos}    onChange={onChange}/>
        <input name="sueldo_base"  placeholder="Sueldo base (mensual)"  type="number" value={form.sueldo_base}  onChange={onChange}/>
        <input name="tarifa_diaria"placeholder="Tarifa diaria" type="number" value={form.tarifa_diaria}onChange={onChange}/>
        <button style={{ padding:8,border:'1px solid #ccc',borderRadius:6 }}>Crear</button>
      </form>

      {err  && <p style={{color:'red',marginTop:10}}>Error: {err}</p>}
      {resp && (
        <div style={{marginTop:12, border:'1px solid #eee', padding:10}}>
          <p>Colaborador creado con ID:</p>
          <h3>{resp.id_publico}</h3>
        </div>
      )}
    </main>
  );
}
