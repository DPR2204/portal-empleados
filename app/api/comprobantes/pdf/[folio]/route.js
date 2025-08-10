// app/api/comprobantes/pdf/[folio]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(_req, { params }) {
  try {
    const folio = decodeURIComponent(params.folio || '').trim().toUpperCase();
    if (!folio) {
      return NextResponse.json({ error: 'Folio requerido' }, { status: 400 });
    }

    // 1) Traer comprobante + colaborador
    const { data, error } = await supabaseAdmin
      .from('comprobante')
      .select(`
        folio, tipo, monto, periodo, fecha, concepto, created_at,
        colaborador:colaborador_id (nombres, apellidos, id_publico)
      `)
      .eq('folio', folio)
      .limit(1);

    if (error) throw error;
    const c = data?.[0];
    if (!c) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    // 2) PDF base
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const MARGIN = 50;
    let y = height - 60;

    const clean = (t) => String(t ?? '')
      .replace(/[\u2010-\u2015]/g, '-')
      .replace(/[\u00A0\u202F]/g, ' ');

    const text = (t, { size = 12, b = false, center = false } = {}) => {
      const s = clean(t);
      const f = b ? bold : font;
      const w = f.widthOfTextAtSize(s, size);
      const x = center ? (width - w) / 2 : MARGIN;
      page.drawText(s, { x, y, size, font: f, color: rgb(0, 0, 0) });
      y -= size + 6;
    };

    // 3) Logo (opcional, mismo del PDF de orden)
    try {
      const logoUrl = 'https://static.wixstatic.com/media/acc6a6_c04fbb5b936a414fbfe6e4fe977a813b~mv2.png';
      const bytes = await fetch(logoUrl).then(r => r.arrayBuffer());
      const img = await pdf.embedPng(bytes);
      const scaled = img.scale(150 / img.width);
      page.drawImage(img, {
        x: (width - scaled.width) / 2,
        y: y - scaled.height + 6,
        width: scaled.width,
        height: scaled.height
      });
      y -= scaled.height + 40;
    } catch (_) {
      // si falla el logo, continuamos
    }

    // 4) Encabezado
    text('Atitlán Rest y Café', { size: 14, b: true, center: true });
    text('Oficina de RRHH', { size: 12, center: true });
    text('+502 2268-1254 ext 102', { size: 10, center: true });
    text('keily_rrhh@atitlanrestaurantes.com', { size: 10, center: true });
    y -= 30;

    // 5) Cuerpo
    text('COMPROBANTE', { size: 16, b: true });
    text(`Folio: ${c.folio}`);
    text(`Colaborador: ${c.colaborador?.nombres} ${c.colaborador?.apellidos} (${c.colaborador?.id_publico})`);
    text(`Tipo: ${c.tipo}`);
    if (c.periodo) text(`Periodo: ${c.periodo}`);
    if (c.fecha) text(`Fecha: ${c.fecha}`);
    if (c.concepto) text(`Concepto: ${c.concepto}`);
    const money = n => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
    text(`Monto: ${money(c.monto)}`, { b: true });
    y -= 30;

    // 6) Firmas
    const drawLine = (label, x) => {
      const lineY = y;
      page.drawLine({
        start: { x, y: lineY },
        end: { x: x + 210, y: lineY },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
      page.drawText(clean(label), { x: x + 60, y: lineY - 12, size: 10, font, color: rgb(0, 0, 0) });
    };
    drawLine('Autorizó', MARGIN);
    drawLine('Recibí conforme', width - MARGIN - 210);
    y -= 90;

    text(`Emitido: ${String(c.created_at).slice(0, 10)}`, { size: 10 });

    // 7) Respuesta
    const bytes = await pdf.save();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${c.folio}.pdf"`,
      },
    });

  } catch (err) {
    console.error('PDF Comprobante Error:', err);
    return NextResponse.json({ error: err?.message || 'Error al generar PDF' }, { status: 500 });
    }
}
