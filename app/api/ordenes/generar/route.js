import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req) {
  try {
    const {
      idPublico,
      frecuencia,
      anio,
      mes,
      quincena,
      inicio,
      fin,
      dias_laborados,
      otros_descuentos = 0
    } = await req.json();

    // Buscamos al colaborador por su id_publico
    const { data: colabs, error: errColab } = await supabaseAdmin
      .from('colaborador')
      .select('id,sueldo_base,tarifa_diaria')
      .eq('id_publico', idPublico)
      .limit(1);
    if (errColab) throw errColab;
    const colab = colabs?.[0];
    if (!colab) {
      return new Response(JSON.stringify({ error: 'Colaborador no encontrado' }), { status: 404 });
    }

    // (Aquí sigue tu lógica de buildPeriodo, cálculos, insert, etc.)
    // Asegúrate de insertar `colaborador_id: colab.id` y no usar el email.

    // Al final devuelves:
    // { ok:true, folio, verify_token: inserted.verify_token, periodo, bruto, adelantos, neto }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
