// app/page.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const signIn = async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/` },
    });
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  if (loading) return <div className="section"><p className="muted">Cargando…</p></div>;

  if (!session) {
    return (
      <div className="section">
        <div className="card stack-12" style={{maxWidth: 720}}>
          <h2>Bienvenido</h2>
          <p className="muted">Inicia sesión para continuar.</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={signIn}>Continuar con Google</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="card stack-12" style={{maxWidth: 900}}>
        <p>Sesión iniciada como <strong>{session.user.email}</strong></p>
        <div className="actions">
          <a className="btn" href="/ordenes">Mis Órdenes</a>
          <a className="btn" href="/verify">Verificar folio</a>
          <button className="btn" onClick={signOut}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}
