import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function pad(n){ return n<10 ? '0'+n : ''+n; }
function fmt(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function lastDayOfMonth(y,m){ return new Date(y,m,0).getDate(); }

function buildPeriodo({ frecuencia, anio, mes, quincena, inicio, fin }) {
  if (frecuencia==='MENSUAL') {
    const y=+anio, m=+mes, fi=new Date(y,m-1,1), ff=new Date(y,m-1,lastDayOfMonth(y,m));
    return { id:`${y}-${pad(m)}-M`, fechaInicio:fi, fechaFin:ff, fechaPago:new Date(y,m,1) };
  }
  if (frecuencia==='QUINCENAL') {
    const y=+anio, m=+mes;
    if (quincena==='Q1') { return { id:`${y}-${pad(m)}-Q1`, fechaInicio:new Date(y,m-1,1), fechaFin:new Date(y,m-1,15), fechaPago:new Date(y,m-1,15) }; }
    const ld=lastDayOfMonth(y,m);
    return { id:`${y}-${pad(m)}-Q2`, fechaInicio:new Date(y,m-1,16), fechaFin:new Date(y,m-1,ld), fechaPago:new Date(y,m-1,ld) };
  }
  if (frecuencia==='DIAS') {
    const fi=new Date(inicio), ff=new Date(fin);
    return { id:`${inicio.replaceAll('-','')}-${fin.replaceAll('-','')}-D`, fechaInicio:fi, fechaFin:ff, fechaPago:ff };
  }
  throw new Error('Frecuencia inválida');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { emailColaborador, frecuencia, anio, mes, quincena, inicio, fin, dias_laborados, otros_descuentos=0 } = body;

    const { data: colabs, error: errColab } = await supabaseAdmin
      .from('colaborador')
      .select('id,id_publico,email,sueldo_base,tarifa_diaria')
      .eq('email', emailColaborador).limit(1);
    if (errColab) throw errColab;
    const colab = colabs?.[0];
    if (!colab) return new Response(JSON.stringify({ error:'Colaborador no encontrado' }), { status:404 });

    const per = buildPeriodo({ frecuencia, anio, mes, quincena, inicio, fin });
    const fecha_inicio = fmt(per.fechaInicio), fecha_fin = fmt(per.fechaFin), fecha_pago_esperada = fmt(per.fechaPago);

    let bruto=0;
    if (frecuencia==='MENSUAL') bruto=+colab.sueldo_base||0;
    else if (frecuencia==='QUINCENAL') bruto=(+colab.sueldo_base||0)/2;
    else if (frecuencia==='DIAS') bruto=(+colab.tarifa_diaria||0) * (+dias_laborados||0);

    const { data: adel } = await supabaseAdmin
      .from('adelanto').select('monto')
      .eq('colaborador_id', colab.id).gte('fecha', fecha_inicio).lte('fecha', fecha_fin).eq('liquidado', false);
    const sumaAdelantos = (adel||[]).reduce((a,x)=>a+(+x.monto||0),0);

    const neto = Math.max(0, bruto - sumaAdelantos - (+otros_descuentos||0));
    const folio = `${colab.id_publico}-${per.id}-${Math.random().toString().slice(2,6)}`;

    const { data: inserted, error: errIns } = await supabaseAdmin
      .from('orden_pago')
      .insert({
        folio, colaborador_id: colab.id, periodo: per.id, frecuencia,
        fecha_inicio, fecha_fin, fecha_pago_esperada,
        dias_laborados: frecuencia==='DIAS' ? (+dias_laborados||0) : null,
        bruto, adelantos: sumaAdelantos, otros_descuentos: (+otros_descuentos||0),
        neto, estado: 'EMITIDO'
      })
      .select('verify_token, folio').single();

    if (errIns) {
      if (errIns.code==='23505') return new Response(JSON.stringify({ error:'Ya existe una orden para ese periodo y frecuencia' }), { status:409 });
      throw errIns;
    }

    return new Response(JSON.stringify({ ok:true, folio: inserted.folio, verify_token: inserted.verify_token, periodo: per.id, bruto, adelantos: sumaAdelantos, neto }), { status:200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message||'Error' }), { status:500 });
  }
}
