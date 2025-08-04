import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { randomUUID } from 'crypto';

export async function POST(req) {
  try {
    const { email, nombres='', apellidos='', sueldo_base=0, tarifa_diaria=0 } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error:'Email obligatorio' }), { status:400 });
    }

    // genera ID público EMP-XXXXX
    const id_publico = 'EMP-' + randomUUID().slice(0,5).toUpperCase();

    const { error } = await supabaseAdmin
      .from('colaborador')
      .insert({
        id_publico,
        email,
        nombres,
        apellidos,
        sueldo_base: +sueldo_base || 0,
        tarifa_diaria: +tarifa_diaria || 0
      });

    if (error && error.code !== '23505') throw error;      // 23505 = email duplicado

    return new Response(JSON.stringify({ ok:true, id_publico }), { status:200 });
  } catch (e) {
    return new Response(JSON.stringify({ error:e.message||'Error' }), { status:500 });
  }
}
