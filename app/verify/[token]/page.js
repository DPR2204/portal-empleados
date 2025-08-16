// app/verify/[token]/page.js
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function VerifyTokenPage({ params }) {
  const token = params.token

  const [{ data: ord }, { data: comp }] = await Promise.all([
    supabaseAdmin.from('orden_pago')
      .select('folio, periodo, frecuencia, neto, created_at')
      .eq('verify_token', token)
      .maybeSingle(),
    supabaseAdmin.from('comprobante')
      .select('folio, tipo, monto, periodo, fecha, concepto, created_at')
      .eq('verify_token', token)
      .maybeSingle(),
  ])

  if (!ord && !comp) {
    return (
      <main className="section">
        <h2>No encontrada o token inválido.</h2>
      </main>
    )
  }

  return (
    <main className="section">
      {ord && (
        <div className="card stack-12">
          <h2>Orden de Pago</h2>
          <p><b>Folio:</b> {ord.folio}</p>
          <p><b>Periodo:</b> {ord.periodo} · <b>Frecuencia:</b> {ord.frecuencia}</p>
          <p><b>Neto:</b> {new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ'}).format(ord.neto)}</p>
          <p><b>Emitida:</b> {String(ord.created_at).slice(0,10)}</p>
          <div className="actions">
            <a className="btn" href={`/api/ordenes/pdf/${token}`} target="_blank" rel="noreferrer">PDF</a>
          </div>
        </div>
      )}

      {comp && (
        <div className="card stack-12">
          <h2>Comprobante</h2>
          <p><b>Folio:</b> {comp.folio}</p>
          <p><b>Tipo:</b> {comp.tipo} · <b>Monto:</b> {new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ'}).format(comp.monto)}</p>
          {comp.periodo && <p><b>Periodo:</b> {comp.periodo}</p>}
          {comp.fecha && <p><b>Fecha:</b> {comp.fecha}</p>}
          {comp.concepto && <p><b>Concepto:</b> {comp.concepto}</p>}
          <p><b>Emitido:</b> {String(comp.created_at).slice(0,10)}</p>
          <div className="actions">
            <a className="btn" href={`/api/comprobantes/pdf/${token}`} target="_blank" rel="noreferrer">PDF</a>
          </div>
        </div>
      )}
    </main>
  )
}
