// app/api/ordenes/folio/[folio]/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req, { params }) {
  const { folio } = params;
  // Busca la orden por su folio
  const { data, error } = await supabaseAdmin
    .from('orden_pago')
    .select('verify_token')
    .eq('folio', folio)
    .single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: 'Folio no encontrado' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ verify_token: data.verify_token }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
