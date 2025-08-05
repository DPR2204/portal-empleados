// app/layout.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export const metadata = {
  title: 'Portal de Empleados',
  description: 'MVP Portal Empleados - Órdenes de Pago',
};

export default function RootLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const email = session.user.email;

          // 1) Comprueba si ya existe colaborador con ese email
          const { data: existing, error: e1 } = await supabase
            .from('colaborador')
            .select('id_publico')
            .eq('email', email)
            .maybeSingle();

          if (e1) {
            console.error('Error comprobando colaborador:', e1);
            return;
          }

          // 2) Si no existe, lo crea con valores por defecto
          if (!existing) {
            const nuevoIdPublico = `CO-${Math.random()
              .toString(36)
              .slice(-6)
              .toUpperCase()}`;

            const { data: col, error: e2 } = await supabase
              .from('colaborador')
              .insert({
                email,
                id_publico: nuevoIdPublico,
                nombres: session.user.user_metadata.full_name || '',
                apellidos: '',
                sueldo_base: 0,
                tarifa_diaria: 0,
                frecuencia_default: 'MENSUAL',
                // añade aquí otros campos NOT NULL con un valor por defecto
              })
              .single();

            if (e2) {
              console.error('Error creando colaborador:', e2);
              return;
            }

            // 3) Redirige al formulario para que complete datos faltantes
            router.push(
              `/colaboradores/nuevo?email=${encodeURIComponent(email)}`
            );
          }
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [router]);

  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
          {/* ---------- Encabezado ---------- */}
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <h1 style={{ fontSize: 20 }}>Portal de Empleados</h1>
            <nav style={{ display: 'flex', gap: 16, fontSize: 14 }}>
              <a href="/">Inicio</a>
              <a href="/ordenes">Mis Órdenes</a>
              <a href="/ordenes/nueva">Nueva Orden</a>
              <a href="/colaboradores/nuevo">Nuevo Colaborador</a>
              <a href="/verify">Verificar Folio</a>
            </nav>
          </header>

          {/* ---------- Contenido de la página ---------- */}
          {children}

          {/* ---------- Pie de página ---------- */}
          <footer style={{ marginTop: 40, fontSize: 12, color: '#666' }}>
            © {new Date().getFullYear()} Portal Empleados
          </footer>
        </div>
      </body>
    </html>
  );
}
