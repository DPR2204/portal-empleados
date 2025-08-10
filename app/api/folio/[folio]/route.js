import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(_req, { params }) {
  const folio = decodeURIComponent(params.folio);

  // 1) Orden de pago
  const { data: op, error: e1 } = await supabaseAdmin
    .from('orden_pago')
    .select('verify_token')
    .eq('folio', folio)
    .limit(1);

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  if (op && op[0]) return NextResponse.json({ verify_token: op[0].verify_token });

  // 2) Comprobante
  const { data: cp, error: e2 } = await supabaseAdmin
    .from('comprobante')
    .select('verify_token')
    .eq('folio', folio)
    .limit(1);

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  if (cp && cp[0]) return NextResponse.json({ verify_token: cp[0].verify_token });

  return NextResponse.json({ error: 'Folio no encontrado' }, { status: 404 });
}
