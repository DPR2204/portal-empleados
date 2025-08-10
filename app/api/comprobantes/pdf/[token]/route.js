import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
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
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const write = (txt, y, size = 12, isBold = false) => {
      page.drawText(String(txt ?? ''), {
        x: 50,
        y,
        size,
        font: isBold ? bold : font,
        color: rgb(0, 0, 0),
      });
    };

    let y = height - 60;
    write('ATITLÁN REST Y CAFÉ — Comprobante', y, 16, true);
    y -= 28;

    write(`Folio: ${row.folio}`, y); y -= 18;
    write(`Colaborador: ${row.colaborador?.nombres} ${row.colaborador?.apellidos} (${row.colaborador?.id_publico})`, y); y -= 18;
    write(`Tipo: ${row.tipo}`, y); y -= 18;
    write(`Monto (GTQ): Q ${Number(row.monto || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`, y); y -= 18;
    if (row.periodo) { write(`Periodo: ${row.periodo}`, y); y -= 18; }
    if (row.fecha)   { write(`Fecha: ${row.fecha}`, y);   y -= 18; }
    if (row.concepto){ write(`Concepto: ${row.concepto}`, y); y -= 18; }
    write(`Emitido: ${String(row.created_at).slice(0,10)}`, y); y -= 28;

    // Firmas
    const drawLine = (x, yy, label) => {
      page.drawLine({ start:{x, y:yy}, end:{x:x+210, y:yy}, thickness:0.8, color:rgb(0,0,0) });
      page.drawText(label, { x: x+60, y: yy-12, size:10, font, color:rgb(0,0,0) });
    };
    drawLine(50, y, 'Autorizó');  drawLine(width-260, y, 'Recibí conforme');

    const bytes = await pdf.save();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${row.folio}.pdf"`,
      },
    });
  } catch (e) {
    console.error('PDF comprobante error:', e);
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}
