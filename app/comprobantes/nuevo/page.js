'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const TIPOS = ['BONO','VACACIONES','AGUINALDO','CONSTANCIA','OTRO'];

export default function NuevoComprobantePage() {
  const [me, setMe] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Campos
  const [colabId, setColabId] = useState('');
  const [buscaEmail, setBuscaEmail] = useState('');
  const [encontrado, setEncontrado] = useState(null);

  const [tipo, setTipo] = useState('BONO');
  const [concepto, setConcepto] = useState('');
  const [periodo, setPeriodo] = useState('');   // ej. 2025-08
  const [fecha, setFecha] = useState('');
  const [monto, setMonto] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMe(user ?? null);

      let admin = false;
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        admin = prof?.role === 'ADMIN';
      }
      setIsAdmin(admin);
      setLoading(false);
    })();
  }, []);

  const buscarPorEmail = async () => {
    setMsg('');
    setEncontrado(null);
    if (!buscaEmail) return;
    const { data, error } = await supabase
      .from('colaborador')
      .select('id,nombres,apellidos,email')
      .ilike('email', buscaEmail);
    if (error) { setMsg(error.message); return; }
    if (!data || data.length === 0) { setMsg('No se encontró colaborador'); return; }
    if (data.length > 1) { setMsg('Hay más de un resultado, afina el correo.'); return; }
    setEncontrado(data[0]);
    setColabId(data[0].id);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!isAdmin) { setMsg('Solo ADMIN puede emitir comprobantes.'); return; }
    if (!colabId || !tipo || !monto) { setMsg('Falta colaborador, tipo o monto.'); return; }

    const payload = {
      colaborador_id: colabId,
      tipo,
      concepto: concepto || null,
      periodo: periodo || null,
      fecha: fecha || null,
      monto: Number(monto || 0),
    };

    const { data, error } = await supabase
      .from('comprobante')
      .insert(payload)
      .select('id, verify_token')
      .single();

    if (error) { setMsg(error.message); return; }
    setMsg(`Comprobante emitido. Token: ${data.verify_token}`);
    // Opcional: limpiar
    // setColabId(''); setEncontrado(null); setConcepto(''); setPeriodo(''); setFecha(''); setMonto('');
  };

  if (loading) return <main className="section"><div className="card">Cargando…</div></main>;
  if (!isAdmin) return <main className="section"><div className="card">Solo ADMIN.</div></main>;

  return (
    <main className="section">
      <div className="card stack-12">
        <h2 className="h2">Nuevo Comprobante</h2>

        <form onSubmit={guardar} className="stack-8">
          <div className="stack-6">
            <label className="label">Buscar colaborador por correo</label>
            <div className="row gap-8">
              <input className="input" placeholder="alguien@dominio.com"
                     value={buscaEmail} onChange={e=>setBuscaEmail(e.target.value)} style={{maxWidth: 360}} />
              <button type="button" className="btn" onClick={buscarPorEmail}>Buscar</button>
            </div>
            {encontrado && (
              <p className="muted">Encontrado: <b>{encontrado.nombres} {encontrado.apellidos}</b> — {encontrado.email}</p>
            )}
            <label className="label">Colaborador ID</label>
            <input className="input" placeholder="UUID del colaborador"
                   value={colabId} onChange={e=>setColabId(e.target.value)} />
          </div>

          <div className="grid-2 gap-12">
            <div className="stack-6">
              <label className="label">Tipo</label>
              <select className="select" value={tipo} onChange={e=>setTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="stack-6">
              <label className="label">Monto (GTQ)</label>
              <input className="input" type="number" step="0.01" value={monto} onChange={e=>setMonto(e.target.value)} />
            </div>
          </div>

          <div className="grid-2 gap-12">
            <div className="stack-6">
              <label className="label">Periodo (opcional)</label>
              <input className="input" placeholder="ej. 2025-08" value={periodo} onChange={e=>setPeriodo(e.target.value)} />
            </div>
            <div className="stack-6">
              <label className="label">Fecha (opcional)</label>
              <input className="input" type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
            </div>
          </div>

          <div className="stack-6">
            <label className="label">Concepto (opcional)</label>
            <input className="input" placeholder="Descripción breve" value={concepto} onChange={e=>setConcepto(e.target.value)} />
          </div>

          <div className="row gap-8">
            <button className="btn" type="submit">Guardar</button>
            {msg && <span className="muted">{msg}</span>}
          </div>
        </form>
      </div>
    </main>
  );
}
