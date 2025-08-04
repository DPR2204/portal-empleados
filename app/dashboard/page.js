'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  if (!session) {
    return (
      <main>
        <p>No has iniciado sesión.</p>
        <a href="/">Volver</a>
      </main>
    );
  }

  return (
    <main>
      <h2>Dashboard</h2>
      <ul>
        <li><a href="/ordenes/nueva">Generar Orden (próximamente)</a></li>
        <li><a href="/ordenes">Mis Órdenes (próximamente)</a></li>
      </ul>
    </main>
  );
}
