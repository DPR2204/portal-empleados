// app/api/ordenes/generar/route.js
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function pad(n){ return n < 10 ? '0' + n : '' + n; }
function lastDayOfMonth(y,m){ return new Date(y,m,0).getDate(); }
function buildPeriodo({ frecuencia, anio, mes, quincena, inicio, fin }) {
  /* ... tu función idéntica ... */
}

export async function POST(req) {
  try {
    const body = await req.json();
    // antes tenías { emailColaborador, ... }
    const {
      idPublico,
      frecuencia,
      anio, mes, quincena, inicio, fin,
      dias_laborados, otros_descuentos = 0
    } = body;

    // Busca al colaborador POR SU ID PÚBLICO
    const { data: colabs, error: errColab } = await supabaseAdmin
      .from('colaborador')
      .select('id,id_publico,email,sueldo_base,tarifa_diaria')
      .eq('id_publico', idPublico)
      .limit(1);

    if (errColab) throw errColab;
    const colab = colabs?.[0];
    if (!colab) {
      return new Response(
        JSON.stringify({ error: 'Colaborador no encontrado' }),
        { status: 404 }
      );
    }

    // Calcula periodo y montos
    const per = buildPeriodo({ frecuencia, anio, mes, quincena, inicio, fin });
    const fecha_inicio = `${per.fechaInicio.getFullYear()}-${pad(per.fechaInicio.getMonth()+1)}-${pad(per.fechaInicio.getDate())}`;
    const fecha_fin     = `${per.fechaFin.getFullYear()    }-${pad(per.fechaFin.getMonth()+1)    }-${pad(per.fechaFin.getDate())    }`;
    const fecha_pago    = `${per.fechaPago.getFullYear()   }-${pad(per.fechaPago.getMonth()+1)   }-${pad(per.fechaPago.getDate())   }`;

    let bruto = 0;
    if (frecuencia === 'MENSUAL')    bruto = +colab.sueldo_base || 0;
    else if (frecuencia === 'QUINCENAL') bruto = (+colab.sueldo_base || 0) / 2;
    else if (frecuencia === 'DIAS')  bruto = (+colab.tarifa_diaria || 0) * (+dias_laborados || 0);

    // Adelantos en el periodo
    const { data: adel } = await supabaseAdmin
      .from('adelanto')
      .select('monto')
      .eq('colaborador_id', colab.id)
      .gte('fecha', fecha_inicio)
      .lte('fecha', fecha_fin)
      .eq('liquidado', false);
    const sumaAdelantos = (adel||[]).reduce((a,x)=>a+(+x.monto||0),0);

    const neto = Math.max(0, bruto - sumaAdelantos - (+otros_descuentos||0));
    // Ahora sí usamos el id_publico para el folio
    const folio = `${colab.id_publico}-${per.id}-${Math.random().toString().slice(2,6)}`;

    // Inserta
    const { data: inserted, error: errIns } = await supabaseAdmin
      .from('orden_pago')
      .insert({
        folio,
        colaborador_id: colab.id,
        periodo: per.id,
        frecuencia,
        fecha_inicio, fecha_fin, fecha_pago_esperada: fecha_pago,
        dias_laborados: frecuencia === 'DIAS' ? (+dias_laborados||0) : null,
        bruto, adelantos: sumaAdelantos, otros_descuentos: (+otros_descuentos||0),
        neto, estado: 'EMITIDO'
      })
      .select('folio, verify_token').single();

    if (errIns) {
      if (errIns.code === '23505') {
        return new Response(
          JSON.stringify({ error:'Ya existe una orden para ese periodo y frecuencia' }),
          { status:409 }
        );
      }
      throw errIns;
    }

    // Devolvemos folio y token
    return new Response(
      JSON.stringify({
        ok: true,
        folio: inserted.folio,
        verify_token: inserted.verify_token,
        periodo: per.id,
        bruto, adelantos: sumaAdelantos, neto
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
