'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let sub;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
      });
      sub = listener?.subscription;
    })();

    return () => sub?.unsubscribe?.();
  }, []);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <main className="card">
        <p>Cargando…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="section">
        <div className="card stack-12">
          <h2 className="h2">Bienvenido</h2>
          <p className="muted">Inicia sesión para continuar.</p>
          <div className="actions">
            <button className="btn primary" onClick={signIn}>
              Continuar con Google
            </button>
            <span className="muted" style={{ fontSize: 12 }}>
              Si ves errores de OAuth, revisa las URLs de redirección en Google y Supabase.
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="card stack-12">
        <h2 className="h2">Hola, {session.user.email}</h2>
        <div className="actions">
          <Link className="btn" href="/dashboard">Ir al Dashboard</Link>
          <Link className="btn" href="/verify/DEMO-TOKEN">Verificar orden (demo)</Link>
          <button className="btn" onClick={signOut}>Cerrar sesión</button>
        </div>
      </div>
    </main>
  );
}
