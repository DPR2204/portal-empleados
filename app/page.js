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
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/` }
    });
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  if (loading) return <main className="section"><div className="card">Cargando…</div></main>;

  if (!session) {
    return (
      <main className="section">
        <div className="card stack-12">
          <h2 className="h2">Portal de Empleados</h2>
          <p className="muted">Inicia sesión para continuar.</p>
          <button className="btn primary" onClick={signIn}>Continuar con Google</button>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="card stack-12">
        <p>Sesión iniciada como <strong>{session.user.email}</strong></p>
        <div className="actions">
          <a className="btn" href="/ordenes">Mis Órdenes</a>
          <a className="btn" href="/verify">Verificar folio</a>
          <button className="btn" onClick={signOut}>Cerrar sesión</button>
        </div>
      </div>
    </main>
  );
}
