// app/api/ordenes/pdf/[token]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(request, { params }) {
  try {
    const token = params.token; // verify_token

    // 1) Traer la orden + datos del colaborador
    const { data: rows, error } = await supabaseAdmin
      .from('orden_pago')
      .select(`
        folio,
        periodo,
        frecuencia,
        bruto,
        adelantos,
        otros_descuentos,
        neto,
        fecha_inicio,
        fecha_fin,
        fecha_pago_esperada,
        created_at,
        colaborador:colaborador_id (nombres, apellidos, id_publico)
      `)
      .eq('verify_token', token)
      .limit(1);

    if (error) throw error;
    const op = rows?.[0];
    if (!op) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // 2) Crear el PDF
    const pdf  = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font  = await pdf.embedFont(StandardFonts.Helvetica);
    const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

    // — Logo y cabecera estética —
    const logoUrl   = 'https://static.wixstatic.com/media/acc6a6_c04fbb5b936a414fbfe6e4fe977a813b~mv2.png';
    const logoBytes = await fetch(logoUrl).then(r => r.arrayBuffer());
    const logoImage = await pdf.embedPng(logoBytes);
    const logoDims  = logoImage.scale(0.5);

    const { width: pw } = page.getSize();
    // centra y dibuja logo
    page.drawImage(logoImage, {
      x: (pw - logoDims.width) / 2,
      y: 770,
      width:  logoDims.width,
      height: logoDims.height,
    });

    // helper de dibujo
    const draw = (text, x, y, opts = {}) => {
      const { size = 12, bold = false } = opts;
      page.drawText(text, {
        x, y, size,
        font: bold ? fontB : font,
        color: rgb(0, 0, 0),
      });
    };

    // líneas de texto bajo el logo (centradas)
    let y = 770 - logoDims.height - 10;
    const centerX = pw / 2;
    const headerLines = [
      'Atitlán Rest y Café',
      'Oficina de RRHH',
      '+502 2268-1254 ext 102',
      'keily_rrhh@atitlanrestaurantes.com',
    ];
    headerLines.forEach((line, i) => {
      const size = i === 0 ? 14 : 10;
      const textWidth = (i===0)
        ? fontB.widthOfTextAtSize(line, size)
        : font.widthOfTextAtSize(line, size);
      draw(
        line,
        centerX - textWidth / 2,
        y - i * (size + 4),
        { size, bold: i === 0 }
      );
    });

    // baja cursor para datos
    y = y - headerLines.length * 18 - 20;

    // 3) Contenido de la orden
    const fmtMoney = n =>
      `Q ${Number(n||0).toLocaleString('es-GT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    draw('ORDEN DE PAGO', 50, y, { bold: true, size: 18 });
    y -= 20;
    draw(`Folio: ${op.folio}`, 50, y);               y -= 14;
    draw(
      `Colaborador: ${op.colaborador.nombres} ${op.colaborador.apellidos} (${op.colaborador.id_publico})`,
      50, y
    );                                               y -= 14;
    draw(`Periodo: ${op.periodo}   Frecuencia: ${op.frecuencia}`, 50, y);
    y -= 14;
    draw(
      `Del ${op.fecha_inicio} al ${op.fecha_fin} | Pago esperado: ${op.fecha_pago_esperada}`,
      50, y
    );
    y -= 24;

    draw('RESUMEN', 50, y, { bold: true, size: 14 });
    y -= 16;
    draw(`Bruto:        ${fmtMoney(op.bruto)}`, 50, y);        y -= 14;
    draw(`Adelantos:    ${fmtMoney(op.adelantos)}`, 50, y);    y -= 14;
    draw(`Otros desc.:  ${fmtMoney(op.otros_descuentos)}`, 50, y);
    y -= 16;
    draw(`NETO A PAGAR: ${fmtMoney(op.neto)}`, 50, y, { bold: true, size: 14 });
    y -= 30;

    // firmas
    const line = (x1, y1, x2) =>
      page.drawLine({ start:{x:x1,y:y1}, end:{x:x2,y:y1}, thickness:0.8, color:rgb(0,0,0) });

    line(50, y, 260);  draw('Colaborador',          100, y-12);
    line(330, y, 540); draw('Aprobó (RH/Finanzas)', 380, y-12);
    y -= 40;
    line(50, y, 260);  draw('Entregado por',        100, y-12);
    line(330, y, 540); draw('Recibido por',         380, y-12);
    y -= 30;
    draw(`Emitido: ${op.created_at.slice(0,10)}`, 50, y, { size: 10 });

    // 4) Retornar PDF
    const pdfBytes = await pdf.save();
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="${op.folio}.pdf"`,
      },
    });

  } catch (e) {
    console.error('PDF Error:', e);
    return NextResponse.json(
      { error: e.message || 'Error al generar PDF' },
      { status: 500 }
    );
  }
}
