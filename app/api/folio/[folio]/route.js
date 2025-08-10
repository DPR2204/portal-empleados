// app/api/folio/[folio]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(_req, { params }) {
  const folio = decodeURIComponent(params.folio || '').trim().toUpperCase();
  if (!folio) {
    return NextResponse.json({ error: 'Folio requerido' }, { status: 400 });
  }

  const tryOrden = async () => {
    const { data, error } = await supabaseAdmin
      .from('orden_pago')
      .select('verify_token')
      .eq('folio', folio)
      .limit(1);
    if (error) throw error;
    return data?.[0]?.verify_token || null;
  };

  const tryComprobante = async () => {
    const { data, error } = await supabaseAdmin
      .from('comprobante')
      .select('verify_token')
      .eq('folio', folio)
      .limit(1);
    if (error) throw error;
    return data?.[0]?.verify_token || null;
  };

  // Heurística rápida por prefijo (opcional) y fallback a probar ambas
  let token = null;
  if (folio.startsWith('CO-')) token = await tryOrden();
  else if (folio.startsWith('CP-')) token = await tryComprobante();
  else {
    token = await tryOrden();
    if (!token) token = await tryComprobante();
  }

  if (!token) {
    return NextResponse.json({ error: 'Folio no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ verify_token: token });
}
