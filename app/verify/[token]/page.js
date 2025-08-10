import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import Link from 'next/link';

export default async function VerifyTokenPage({ params }) {
  const token = params.token;

  // Orden de pago
  const { data: opRows, error: e1 } = await supabaseAdmin
    .from('orden_pago')
    .select(`
      folio, periodo, frecuencia, neto,
      colaborador:colaborador_id (nombres, apellidos, id_publico)
    `)
    .eq('verify_token', token)
    .limit(1);

  if (e1) throw new Error(e1.message);
  const op = opRows?.[0];

  if (op) {
    return (
      <main>
        <h2>Orden de pago verificada</h2>
        <p><strong>Folio:</strong> {op.folio}</p>
        <p><strong>Colaborador:</strong> {op.colaborador?.nombres} {op.colaborador?.apellidos} ({op.colaborador?.id_publico})</p>
        <p><strong>Periodo:</strong> {op.periodo} — <strong>Frecuencia:</strong> {op.frecuencia}</p>
        <p><strong>Neto:</strong> Q {Number(op.neto || 0).toLocaleString('es-GT', { minimumFractionDigits:2 })}</p>
        <a className="btn" href={`/api/ordenes/pdf/${token}`} target="_blank" rel="noreferrer">PDF</a>{' '}
        <Link className="btn" href="/verify">Ver otro</Link>
      </main>
    );
  }

  // Comprobante
  const { data: cpRows, error: e2 } = await supabaseAdmin
    .from('comprobante')
    .select(`
      folio, tipo, monto, periodo, fecha, concepto,
      colaborador:colaborador_id (nombres, apellidos, id_publico)
    `)
    .eq('verify_token', token)
    .limit(1);

  if (e2) throw new Error(e2.message);
  const cp = cpRows?.[0];

  if (cp) {
    return (
      <main>
        <h2>Comprobante verificado</h2>
        <p><strong>Folio:</strong> {cp.folio}</p>
        <p><strong>Colaborador:</strong> {cp.colaborador?.nombres} {cp.colaborador?.apellidos} ({cp.colaborador?.id_publico})</p>
        <p><strong>Tipo:</strong> {cp.tipo}</p>
        {cp.periodo && <p><strong>Periodo:</strong> {cp.periodo}</p>}
        {cp.fecha && <p><strong>Fecha:</strong> {cp.fecha}</p>}
        {cp.concepto && <p><strong>Concepto:</strong> {cp.concepto}</p>}
        <p><strong>Monto:</strong> Q {Number(cp.monto || 0).toLocaleString('es-GT', { minimumFractionDigits:2 })}</p>
        <a className="btn" href={`/api/comprobantes/pdf/${token}`} target="_blank" rel="noreferrer">PDF</a>{' '}
        <Link className="btn" href="/verify">Ver otro</Link>
      </main>
    );
  }

  return (
    <main>
      <h2>No encontrada o token inválido.</h2>
      <Link className="btn" href="/verify">Volver</Link>
    </main>
  );
}
