'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/`
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <p>Cargando...</p>;

  if (!session) {
    return (
      <main>
        <p>Bienvenido. Inicia sesión para continuar.</p>
        <button onClick={signIn} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
          Continuar con Google
        </button>
        <p style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
          Si ves errores de OAuth, revisa las URLs de redirección en Google y Supabase.
        </p>
      </main>
    );
  }

  return (
    <main>
      <p>Sesión iniciada como <strong>{session.user.email}</strong></p>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <a href="/dashboard">Ir al Dashboard</a>
        <a href="/verify/DEMO-TOKEN">Verificar orden (demo)</a>
        <button onClick={signOut}>Cerrar sesión</button>
      </div>
    </main>
  );
}
