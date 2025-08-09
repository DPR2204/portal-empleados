// app/api/comprobantes/pdf/[folio]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(_req, { params }) {
  try {
    const folio = decodeURIComponent(params.folio);

    // 1) Traer comprobante + colaborador
    const { data, error } = await supabaseAdmin
      .from('comprobante')
      .select(`
        folio,
        verify_token,
        tipo,
        concepto,
        monto,
        periodo,
        fecha,
        created_at,
        colaborador:colaborador_id (nombres, apellidos, id_publico)
      `)
      .eq('folio', folio)
      .limit(1);

    if (error) throw error;
    const row = data?.[0];
    if (!row) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    // 2) Preparar PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const MARGIN = 50;
    let y = height - 70;

    const clean = (t) =>
      String(t ?? '')
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/[\u00A0\u202F]/g, ' ');

    const text = (t, { size = 12, b = false, align = 'left' } = {}) => {
      const s = clean(t);
      const f = b ? bold : font;
      const w = f.widthOfTextAtSize(s, size);
      let x = MARGIN;
      if (align === 'center') x = (width - w) / 2;
      if (align === 'right') x = width - MARGIN - w;
      page.drawText(s, { x, y, size, font: f, color: rgb(0, 0, 0) });
      y -= size + 6;
    };

    // Logo (opcional)
    try {
      const logoUrl =
        'https://static.wixstatic.com/media/acc6a6_c04fbb5b936a414fbfe6e4fe977a813b~mv2.png';
      const bytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
      const img = await pdf.embedPng(bytes);
      const scaled = img.scale(150 / img.width);
      page.drawImage(img, {
        x: (width - scaled.width) / 2,
        y: y - scaled.height + 8,
        width: scaled.width,
        height: scaled.height,
      });
      y -= scaled.height + 40;
    } catch {
      // si falla el logo, seguimos
    }

    // Encabezado
    text('Atitlán Rest y Café', { size: 14, b: true, align: 'center' });
    text('Oficina de RRHH', { size: 12, align: 'center' });
    text('keily_rrhh@atitlanrestaurantes.com', { size: 10, align: 'center' });
    y -= 20;

    // Título
    text('COMPROBANTE DE PAGO', { size: 16, b: true });
    text(`Folio: ${row.folio}`, { b: true });

    // Datos colaborador
    text(
      `Colaborador: ${row.colaborador?.nombres ?? ''} ${row.colaborador?.apellidos ?? ''} (${row.colaborador?.id_publico ?? ''})`
    );
    text(`Tipo: ${row.tipo}`);
    if (row.concepto) text(`Concepto: ${row.concepto}`);
    if (row.periodo) text(`Periodo: ${row.periodo}`);
    if (row.fecha) text(`Fecha: ${row.fecha}`);

    const GTQ = (n) =>
      `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
    y -= 6;
    text(`Monto: ${GTQ(row.monto)}`, { b: true });
    y -= 24;

    // Firmas (dos líneas)
    const line = (x, label) => {
      const ly = y;
      page.drawLine({
        start: { x, y: ly },
        end: { x: x + 210, y: ly },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
      page.drawText(label, { x: x + 60, y: ly - 12, size: 10, font });
    };
    line(MARGIN, 'Autorizó (RH/Finanzas)');
    line(width - MARGIN - 210, 'Recibido por');
    y -= 80;

    // Pie
    const created = (row.created_at || '').toString().slice(0, 19).replace('T', ' ');
    text(`Emitido: ${created}`, { size: 10 });

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
    return NextResponse.json(
      { error: e?.message || 'Error al generar PDF' },
      { status: 500 }
    );
  }
}
