diff --git a/app/api/comprobantes/pdf/[token]/route.js b/app/api/comprobantes/pdf/token/[token]/route.js
index 8c588b225779a17dfb3e4b824723fc49be35b37c..019046450ccb14ce1e988cae90b1041cc738748b 100644
--- a/app/api/comprobantes/pdf/[token]/route.js
+++ b/app/api/comprobantes/pdf/token/[token]/route.js
@@ -1,27 +1,27 @@
 import { NextResponse } from 'next/server';
-import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
+import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin';
 import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
 
 export async function GET(_req, { params }) {
   try {
     const token = params.token;
 
     const { data, error } = await supabaseAdmin
       .from('comprobante')
       .select(`
         folio,
         tipo,
         monto,
         periodo,
         fecha,
         concepto,
         created_at,
         colaborador:colaborador_id (nombres, apellidos, id_publico)
       `)
       .eq('verify_token', token)
       .limit(1);
 
     if (error) throw error;
     const row = data?.[0];
     if (!row) {
       return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
