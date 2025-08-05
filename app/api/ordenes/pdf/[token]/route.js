// app/api/ordenes/pdf/[token]/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function GET(request, { params }) {
  try {
    const token = params.token

    // 1. Recuperamos la orden y datos del colaborador
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
      .limit(1)

    if (error) throw error
    const op = rows?.[0]
    if (!op) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // 2. Creamos el PDF
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89]) // A4 portrait
    const { width, height } = page.getSize()

    // 2.1 Fuentes
    const font      = await pdf.embedFont(StandardFonts.Helvetica)
    const fontBold  = await pdf.embedFont(StandardFonts.HelveticaBold)

    // 2.2 Embebemos logo
    const logoUrl = 'https://static.wixstatic.com/media/acc6a6_c04fbb5b936a414fbfe6e4fe977a813b~mv2.png'
    const logoBytes = await fetch(logoUrl).then(res => res.arrayBuffer())
    const logoImage = await pdf.embedPng(logoBytes)
    const logoDims  = logoImage.scale(0.25) // ajusta escala según tamaño original

    // Dibujamos logo centrado en el margen superior
    const logoX = (width - logoDims.width) / 2
    const logoY = height - logoDims.height - 20
    page.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: logoDims.width,
      height: logoDims.height
    })

    // 2.3 Cabecera textual debajo del logo
    let y = logoY - 16
    const drawText = (txt, opts = {}) => {
      const { x, size = 12, bold = false, align = 'left' } = opts
      const fnt = bold ? fontBold : font
      let drawX = x
      // Si piden centrar
      if (align === 'center') {
        const w = fnt.widthOfTextAtSize(txt, size)
        drawX = (width - w) / 2
      }
      page.drawText(txt, { x: drawX, y, size, font: fnt, color: rgb(0,0,0) })
      y -= size + 4
    }

    drawText('Atitlán Rest y Café',      { size: 14, bold: true, align: 'center' })
    drawText('Oficina de RRHH',          { size: 12, align: 'center' })
    drawText('+502 2268-1254 ext 102',    { size: 10, align: 'center' })
    drawText('keily_rrhh@atitlanrestaurantes.com', { size: 10, align: 'center' })

    // 2.4 Ahora dibujamos el contenido de la orden
    y -= 16
    drawText('ORDEN DE PAGO', { size: 18, bold: true, align: 'left', x: 50 })
    drawText(`Folio: ${op.folio}`, { x: 50 })
    drawText(
      `Colaborador: ${op.colaborador.nombres} ${op.colaborador.apellidos} (${op.colaborador.id_publico})`,
      { x: 50 }
    )
    drawText(`Periodo: ${op.periodo}   Frecuencia: ${op.frecuencia}`, { x: 50 })
    drawText(
      `Del ${op.fecha_inicio} al ${op.fecha_fin} | Pago esperado: ${op.fecha_pago_esperada}`,
      { x: 50 }
    )

    y -= 12
    drawText('RESUMEN', { x: 50, size: 14, bold: true })
    const fmtMoney = n =>
      `Q ${Number(n || 0).toLocaleString('es-GT',{ minimumFractionDigits:2, maximumFractionDigits:2 })}`
    drawText(`Bruto:        ${fmtMoney(op.bruto)}`,         { x: 50 })
    drawText(`Adelantos:    ${fmtMoney(op.adelantos)}`,     { x: 50 })
    drawText(`Otros desc.:  ${fmtMoney(op.otros_descuentos)}`,{ x: 50 })
    drawText(`NETO A PAGAR: ${fmtMoney(op.neto)}`,          { x: 50, size: 14, bold: true })

    // 2.5 Firmas
    y -= 30
    const drawLine = (x1,x2) => page.drawLine({
      start:{ x:x1,y }, end:{ x:x2,y }, thickness:0.8, color:rgb(0,0,0)
    })
    drawLine(50, 260);   drawText('Colaborador',           { x: 100, y:y-12 })
    drawLine(330, 540);  drawText('Aprobó (RH/Finanzas)',  { x: 380, y:y-12 })
    y -= 40
    drawLine(50, 260);   drawText('Entregado por',         { x: 100, y:y-12 })
    drawLine(330, 540);  drawText('Recibido por',          { x: 380, y:y-12 })
    y -= 30
    drawText(`Emitido: ${op.created_at.toString().slice(0,10)}`, { x: 50, size: 10 })

    // 3. Devolvemos el PDF
    const pdfBytes = await pdf.save()
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // inline o attachment según prefieras:
        'Content-Disposition': `inline; filename="${op.folio}.pdf"`
      },
    })

  } catch (e) {
    console.error('PDF Error:', e)
    return NextResponse.json(
      { error: e.message || 'Error al generar PDF' },
      { status: 500 }
    )
  }
}
