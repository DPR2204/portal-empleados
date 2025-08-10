// app/api/comprobantes/folio/[folio]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export async function GET(_req, { params }) {
  const folio = decodeURIComponent(params.folio || '').trim();

  if (!folio) {
    return NextResponse.json({ error: 'Folio requerido' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('comprobante')
    .select('verify_token')
    .ilike('folio', folio)
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  return NextResponse.json({ verify_token: data.verify_token });
}
