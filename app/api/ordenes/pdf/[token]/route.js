// app/api/ordenes/pdf/[token]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(request, { params }) {
  try {
    const token = params.token;
    // … (tu consulta a Supabase igual que antes) …
    const op = rows?.[0];

    // 2. Generamos el PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font  = await pdf.embedFont(StandardFonts.Helvetica);
    const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

    // —————————————————————————————
    // 2.1 Incrusta el logo
    const logoUrl   = 'https://static.wixstatic.com/media/acc6a6_c04fbb5b936a414fbfe6e4fe977a813b~mv2.png';
    const logoBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
    const logoImage = await pdf.embedPng(logoBytes);
    const logoDims  = logoImage.scale(0.5); // ajusta escala si hace falta

    // Dibuja el logo centrado
    const pageWidth = page.getSize().width;
    page.drawImage(logoImage, {
      x: (pageWidth - logoDims.width) / 2,
      y: 770,
      width:  logoDims.width,
      height: logoDims.height,
    });

    // 2.2 Dibuja el encabezado de texto bajo el logo
    let y = 750 - logoDims.height;
    const draw = (text, x, y, options = {}) => {
      const { size = 12, bold = false } = options;
      page.drawText(text, {
        x, y, size,
        font: bold ? fontB : font,
        color: rgb(0, 0, 0),
      });
    };

    const centerX = pageWidth / 2;
    const lines = [
      'Atitlán Rest y Café',
      'Oficina de RRHH',
      '+502 2268-1254 ext 102',
      'keily_rrhh@atitlanrestaurantes.com',
    ];
    lines.forEach((line, i) => {
      const textSize = i === 0 ? 14 : 10;         // título más grande
      const isBold   = i === 0;
      const textWidth = fontB.widthOfTextAtSize(line, textSize);
      draw(
        line,
        centerX - textWidth / 2,
        y - i * (textSize + 4),
        { size: textSize, bold: isBold }
      );
    });

    // Baja el cursor
    y = y - lines.length * 18 - 20;

    // —————————————————————————————
    // 2.3 A partir de aquí tu lógica original de draw('ORDEN DE PAGO'…) 
    draw('ORDEN DE PAGO', 50, y, { bold: true, size: 18 });
    y -= 20;
    // … resto de tus llamadas a draw() y drawLine() …

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
