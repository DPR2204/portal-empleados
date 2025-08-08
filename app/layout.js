'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // usa la misma ruta que en tu repo

export const metadata = {
  title: 'Portal de Empleados',
  description: 'MVP Portal Empleados - Órdenes de Pago',
};

export default function RootLayout({ children }) {
  const router = useRouter();

  async function ensureCollaborator(session) {
    if (!session?.user?.email) return;
    const email = session.user.email.trim().toLowerCase();

    // 1) ¿Existe colaborador con ese email?
    const { data: existing, error: e1 } = await supabase
      .from('colaborador')
      .select('id_publico')
      .eq('email', email)
      .limit(1);

    if (e1) {
      console.error('Error comprobando colaborador:', e1.message);
      return;
    }

    // 2) Si no existe, lo crea con valores por defecto
    if (!existing || existing.length === 0) {
      const nuevoIdPublico = `CO-${Math.random().toString(36).slice(-6).toUpperCase()}`;

      const { error: e2 } = await supabase.from('colaborador').insert({
        email,
        id_publico: nuevoIdPublico,
        nombres: session.user.user_metadata?.full_name || '',
        apellidos: '',
        sueldo_base: 0,
        tarifa_diaria: 0,
        frecuencia_default: 'MENSUAL',
      });

      if (e2) {
        console.error('Error creando colaborador:', e2.message);
        return;
      }

      // 3) Redirige a completar datos
      router.push(`/colaboradores/nuevo?email=${encodeURIComponent(email)}`);
    }
  }

  useEffect(() => {
    let sub;
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) await ensureCollaborator(data?.session);

      const res = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') await ensureCollaborator(session);
      });
      sub = res.data.subscription;
    })();

    return () => { sub?.unsubscribe(); };
  }, [router]);

  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 20 }}>Portal de Empleados</h1>
            <nav style={{ display: 'flex', gap: 16, fontSize: 14 }}>
              <a href="/">Inicio</a>
              <a href="/ordenes">Mis Órdenes</a>
              <a href="/ordenes/nueva">Nueva Orden</a>
              <a href="/colaboradores/nuevo">Nuevo Colaborador</a>
              <a href="/verify">Verificar Folio</a>
            </nav>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
