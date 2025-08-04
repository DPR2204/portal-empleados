import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { randomUUID } from 'crypto';

export async function POST(req) {
  try {
    const { nombres, apellidos, email, sueldo_base, tarifa_diaria } =
      await req.json();

    // Validación mínima
    if (![nombres, apellidos, email].every(Boolean)) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }),
        { status: 400 }
      );
    }

    // Genera ID público tipo “CO-ABCDE”
    const id_publico = 'CO-' +
      randomUUID().replace(/-/g, '').slice(0, 5).toUpperCase();

    const { error } = await supabaseAdmin.from('colaborador').insert({
      id_publico,
      nombres,
      apellidos,
      email,
      sueldo_base: +sueldo_base || 0,
      tarifa_diaria: +tarifa_diaria || 0,
    });

    if (error) {
      // 23505 = violación de unique (correo duplicado)
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'El correo ya está registrado' }),
          { status: 409 }
        );
      }
      throw error;
    }

    return new Response(JSON.stringify({ ok: true, id_publico }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Error' }), {
      status: 500,
    });
  }
}
