// app/api/ordenes/generar/route.js
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function pad(n){ return n<10 ? '0'+n : ''+n; }
function fmt(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function lastDayOfMonth(y,m){ return new Date(y,m,0).getDate(); }

function buildPeriodo({ frecuencia, anio, mes, quincena, inicio, fin }) {
  // …idéntico al previo…
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      idPublico, frecuencia, anio, mes,
      quincena, inicio, fin, dias_laborados, otros_descuentos=0
    } = body;

    // >**Nuevo**: buscamos por id_publico
    const { data: colabs, error: errColab } = await supabaseAdmin
      .from('colaborador')
      .select('id,id_publico,email,sueldo_base,tarifa_diaria')
      .eq('id_publico', idPublico)
      .limit(1);

    if (errColab) throw errColab;
    const colab = colabs?.[0];
    if (!colab) {
      return new Response(
        JSON.stringify({ error:'Colaborador no encontrado' }),
        { status:404 }
      );
    }

    // … resto idéntico: cálculo de periodo, bruto, adelantos, insert …

  } catch(e) {
    return new Response(JSON.stringify({ error:e.message||'Error' }),{status:500});
  }
}
