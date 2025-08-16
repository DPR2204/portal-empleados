diff --git a/app/verify/[token]/page.js b/app/verify/[token]/page.js
index b638aa0fdf5130511fb428da024cc6c3361fd689..e8001527a9404ba944270b7868af4b0e907ff0b4 100644
--- a/app/verify/[token]/page.js
+++ b/app/verify/[token]/page.js
@@ -33,38 +33,38 @@ export default async function VerifyTokenPage({ params }) {
 
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
-        <a className="btn" href={`/api/comprobantes/pdf/${token}`} target="_blank" rel="noreferrer">PDF</a>{' '}
+        <a className="btn" href={`/api/comprobantes/pdf/token/${token}`} target="_blank" rel="noreferrer">PDF</a>{' '}
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
