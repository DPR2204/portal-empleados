import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(_req, { params }) {
  try {
    const token = params.token; // UUID de verify_token

    // Traer la orden + colaborador
    const { data: rows, error } = await supabaseAdmin
      .from('orden_pago')
      .select(`
        folio, periodo, frecuencia, bruto, adelantos, otros_descuentos, neto,
        fecha_inicio, fecha_fin, fecha_pago_esperada, created_at,
        colaborador:colaborador_id ( nombres, apellidos, id_publico )
      `)
      .eq('verify_token', token)
      .limit(1);

    if (error) throw error;
    const op = rows?.[0];
    if (!op) return new Response('Orden no encontrada', { status: 404 });

    // Crear PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

    const draw = (text, x, y, bold=false, size=12) => {
      page.drawText(String(text ?? ''), {
        x, y, size, font: bold ? fontB : font, color: rgb(0,0,0)
      });
    };
    const fmt = (n) => `Q ${Number(n||0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let y = 800;
    draw('ORDEN DE PAGO', 50, y, true, 18); y -= 16;
    draw(`Folio: ${op.folio}`, 50, y, false, 11); y -= 14;
    draw(`Colaborador: ${op.colaborador?.nombres} ${op.colaborador?.apellidos} (${op.colaborador?.id_publico})`, 50, y, false, 11); y -= 14;
    draw(`Periodo: ${op.periodo}   Frecuencia: ${op.frecuencia}`, 50, y, false, 11); y -= 14;
    draw(`Del ${op.fecha_inicio} al ${op.fecha_fin}  |  Pago esperado: ${op.fecha_pago_esperada}`, 50, y, false, 11); y -= 22;

    draw('RESUMEN', 50, y, true, 13); y -= 14;
    draw(`Bruto: ${fmt(op.bruto)}`, 50, y); y -= 14;
    draw(`Adelantos: ${fmt(op.adelantos)}`, 50, y); y -= 14;
    draw(`Otros descuentos: ${fmt(op.otros_descuentos)}`, 50, y); y -= 16;
    draw(`NETO A PAGAR: ${fmt(op.neto)}`, 50, y, true, 14); y -= 30;

    // Líneas de firma
    const line = (x1, y1, x2) => page.drawLine({ start: {x:x1,y:y1}, end:{x:x2,y:y1}, thickness: 0.8, color: rgb(0,0,0) });
    line(50, y, 260); draw('Colaborador', 110, y-12);
    line(330, y, 540); draw('Aprobó (RH/Finanzas)', 385, y-12); y -= 50;
    line(50, y, 260); draw('Entregado por', 110, y-12);
    line(330, y, 540); draw('Recibido por', 405, y-12); y -= 40;

    draw(`Emitido: ${String(op.created_at).slice(0,10)}`, 50, y-8, false, 10);

    const pdfBytes = await pdf.save();
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${op.folio}.pdf"`
      }
    });
  } catch (e) {
    return new Response(`Error: ${e.message||e}`, { status: 500 });
  }
}
