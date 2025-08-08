'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function ClientBootstrap() {
  const router = useRouter();

  useEffect(() => {
    let sub;

    async function ensureCollaborator(session) {
      const email = session?.user?.email?.trim().toLowerCase();
      if (!email) return;

      // ¿ya existe colaborador con ese email?
      const { data: existing, error: e1 } = await supabase
        .from('colaborador')
        .select('id_publico')
        .eq('email', email)
        .limit(1);

      if (e1) {
        console.error('Error comprobando colaborador:', e1.message);
        return;
      }

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

        router.push(`/colaboradores/nuevo?email=${encodeURIComponent(email)}`);
      }
    }

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) await ensureCollaborator(data?.session);

      const res = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') await ensureCollaborator(session);
      });
      sub = res.data.subscription;
    })();

    return () => sub?.unsubscribe();
  }, [router]);

  return null;
}
