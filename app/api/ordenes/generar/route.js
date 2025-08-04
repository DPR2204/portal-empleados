// app/api/ordenes/generar/route.js
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

/**
 * buildPeriodo retorna:
 * - id:      "<YYYY>-<MM>-M|Q-..."  
 * - fecha_inicio, fecha_fin, fecha_pago  (tipos Date)
 */
function buildPeriodo({ frecuencia, anio, mes, quincena, inicio, fin }) {
  if (frecuencia === 'MENSUAL') {
    const fi = new Date(anio, mes - 1, 1);
    const ff = new Date(anio, mes - 1, new Date(anio, mes, 0).getDate());
    const fp = new Date(anio, mes, 1);
    return {
      id: `${anio}-${pad(mes)}-M`,
      fecha_inicio: fi,
      fecha_fin:    ff,
      fecha_pago:   fp,
    };
  }

  if (frecuencia === 'QUINCENAL') {
    const day = quincena === 'Q1' ? 1 : 16;
    const fi = new Date(anio, mes - 1, day);
    const ffDay = quincena === 'Q1'
      ? 15
      : new Date(anio, mes, 0).getDate();
    const ff = new Date(anio, mes - 1, ffDay);
    const fp = new Date(anio, mes, 1);
    return {
      id: `${anio}-${pad(mes)}-Q${quincena === 'Q1' ? '1' : '2'}`,
      fecha_inicio: fi,
      fecha_fin:    ff,
      fecha_pago:   fp,
    };
  }

  // 'DIAS'
  const fi = new Date(inicio);
  const ff = new Date(fin);
  return {
    id: `${anio}-${pad(mes)}-D`, // o ajusta como prefieras
    fecha_inicio: fi,
    fecha_fin:    ff,
    fecha_pago:   new Date(ff.getFullYear(), ff.getMonth() + 1, 1),
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      idPublico,
      frecuencia,
      anio, mes, quincena,
      inicio, fin,
      dias_laborados = 0,
      otros_descuentos = 0,
    } = body;

    // 1) Busca colaborador por id_publico
    const { data: colabArr, error: errCol } = await supabaseAdmin
      .from('colaborador')
      .select('id, id_publico, sueldo_base, tarifa_diaria')
      .eq('id_publico', idPublico)
      .limit(1);

    if (errCol) throw errCol;
    const colaborador = colabArr?.[0];
    if (!colaborador) {
      return new Response(
        JSON.stringify({ error: 'Colaborador no encontrado' }),
        { status: 404 }
      );
    }

    // 2) Calcula periodo y fechas
    const per = buildPeriodo({ frecuencia, anio: +anio, mes: +mes, quincena, inicio, fin });
    const fiISO = `${per.fecha_inicio.getFullYear()}-${pad(per.fecha_inicio.getMonth()+1)}-${pad(per.fecha_inicio.getDate())}`;
    const ffISO = `${per.fecha_fin.getFullYear()    }-${pad(per.fecha_fin.getMonth()+1)    }-${pad(per.fecha_fin.getDate())    }`;
    const fpISO = `${per.fecha_pago.getFullYear()   }-${pad(per.fecha_pago.getMonth()+1)   }-${pad(per.fecha_pago.getDate())   }`;

    // 3) Calcula bruto
    let bruto = 0;
    if (frecuencia === 'MENSUAL') bruto = +colaborador.sueldo_base;
    else if (frecuencia === 'QUINCENAL') bruto = (+colaborador.sueldo_base || 0) / 2;
    else if (frecuencia === 'DIAS') bruto = (+colaborador.tarifa_diaria || 0) * (+dias_laborados);

    // 4) Suma adelantos no liquidado en el rango
    const { data: adelArr } = await supabaseAdmin
      .from('adelanto')
      .select('monto')
      .eq('colaborador_id', colaborador.id)
      .gte('fecha', fiISO)
      .lte('fecha', ffISO)
      .eq('liquidado', false);

    const sumaAdel = (adelArr || []).reduce((sum, x) => sum + (+x.monto || 0), 0);
    const neto = Math.max(0, bruto - sumaAdel - (+otros_descuentos || 0));

    // 5) Genera folio único (usa id_publico + periodo.id + random)
    const folio = `${colaborador.id_publico}-${per.id}-${Math.random().toString().slice(2,6)}`;

    // 6) Inserta y devuelve folio + token
    const { data: inserted, error: errIns } = await supabaseAdmin
      .from('orden_pago')
      .insert({
        folio,
        colaborador_id:       colaborador.id,
        periodo:              per.id,
        frecuencia,
        fecha_inicio:         fiISO,
        fecha_fin:            ffISO,
        fecha_pago_esperada:  fpISO,
        dias_laborados:       frecuencia === 'DIAS' ? +dias_laborados : null,
        bruto,
        adelantos:            sumaAdel,
        otros_descuentos:     +otros_descuentos,
        neto,
        estado:               'EMITIDO',
      })
      .select('folio, verify_token')
      .single();

    if (errIns) throw errIns;

    return new Response(
      JSON.stringify({
        ok: true,
        folio: inserted.folio,
        verify_token: inserted.verify_token,
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e.message || 'Error interno' }),
      { status: 500 }
    );
  }
}
