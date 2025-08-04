// app/api/ordenes/generar/route.js
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function lastDayOfMonth(y, m) { return new Date(y, m, 0).getDate(); }

function buildPeriodo({ frecuencia, anio, mes, quincena, inicio, fin }) {
  if (frecuencia === 'MENSUAL') {
    const y = +anio, m = +mes;
    const fi = new Date(y, m - 1, 1);
    const ff = new Date(y, m - 1, lastDayOfMonth(y, m));
    return { id: `${y}-${pad(m)}-M`, fechaInicio: fi, fechaFin: ff, fechaPago: new Date(y, m, 1) };
  }
  if (frecuencia === 'QUINCENAL') {
    const y = +anio, m = +mes;
    if (quincena === 'Q1') {
      return {
        id: `${y}-${pad(m)}-Q1`,
        fechaInicio: new Date(y, m - 1, 1),
        fechaFin: new Date(y, m - 1, 15),
        fechaPago: new Date(y, m - 1, 15),
      };
    }
    const ld = lastDayOfMonth(y, m);
    return {
      id: `${y}-${pad(m)}-Q2`,
      fechaInicio: new Date(y, m - 1, 16),
      fechaFin: new Date(y, m - 1, ld),
      fechaPago: new Date(y, m - 1, ld),
    };
  }
  if (frecuencia === 'DIAS') {
    const fi = new Date(inicio), ff = new Date(fin);
    return { id: `${inicio.replaceAll('-', '')}-${fin.replaceAll('-', '')}-D`, fechaInicio: fi, fechaFin: ff, fechaPago: ff };
  }
  throw new Error('Frecuencia inválida');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      idPublico, frecuencia, anio, mes, quincena,
      inicio, fin, dias_laborados, otros_descuentos = 0
    } = body;

    // 1) Busca colaborador por idPublico
    const { data: colabs, error: errColab } = await supabaseAdmin
      .from('colaborador')
      .select('id, sueldo_base, tarifa_diaria')
      .eq('id_publico', idPublico)
      .limit(1);

    if (errColab) throw errColab;
    const colab = colabs?.[0];
    if (!colab) {
      return new Response(
        JSON.stringify({ error: 'Colaborador no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2) Calcula periodo y montos
    const per = buildPeriodo({ frecuencia, anio, mes, quincena, inicio, fin });
    const fecha_inicio = fmt(per.fechaInicio),
          fecha_fin    = fmt(per.fechaFin),
          fecha_pago   = fmt(per.fechaPago);

    let bruto = 0;
    if (frecuencia === 'MENSUAL') bruto = +colab.sueldo_base || 0;
    else if (frecuencia === 'QUINCENAL') bruto = (+colab.sueldo_base || 0) / 2;
    else bruto = (+colab.tarifa_diaria || 0) * (+dias_laborados || 0);

    // 3) Suma adelantos
    const { data: adel, error: errAdel } = await supabaseAdmin
      .from('adelanto')
      .select('monto')
      .eq('colaborador_id', colab.id)
      .gte('fecha', fecha_inicio)
      .lte('fecha', fecha_fin)
      .eq('liquidado', false);

    if (errAdel) throw errAdel;
    const sumaAdel = (adel || []).reduce((a, x) => a + (+x.monto || 0), 0);

    const neto = Math.max(0, bruto - sumaAdel - (+otros_descuentos || 0));
    const folio = `${colab.id_publico}-${per.id}-${Math.random().toString().slice(2, 6)}`;

    // 4) Inserta orden de pago
    const { data: inserted, error: errIns } = await supabaseAdmin
      .from('orden_pago')
      .insert({
        folio,
        colaborador_id: colab.id,
        periodo: per.id,
        frecuencia,
        fecha_inicio,
        fecha_fin,
        fecha_pago_esperada: fecha_pago,
        dias_laborados: frecuencia === 'DIAS' ? (+dias_laborados || 0) : null,
        bruto,
        adelantos: sumaAdel,
        otros_descuentos: +otros_descuentos,
        neto,
        estado: 'EMITIDO'
      })
      .select('verify_token, folio')
      .single();

    if (errIns) {
      if (errIns.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'Ya existe una orden para ese período' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw errIns;
    }

    // 5) Respuesta exitosa
    return new Response(
      JSON.stringify({
        ok: true,
        folio: inserted.folio,
        verify_token: inserted.verify_token,
        periodo: per.id,
        bruto,
        adelantos: sumaAdel,
        neto
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    // 6) Log interno y devuelve JSON siempre
    console.error('[api/ordenes/generar] ERROR:', e);
    return new Response(
      JSON.stringify({ error: e.message || 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
