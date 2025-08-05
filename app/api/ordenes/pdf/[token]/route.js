// app/api/ordenes/pdf/[token]/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function GET(request, { params }) {
  try {
    const token = params.token // verify_token que llega en la URL

    // 1. Recuperamos la orden y datos del colaborador ---------------------------------------
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
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // 2. Creamos el PDF ---------------------------------------------------------------------
    const pdf  = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89]) // A4 portrait (pt)
    const { width, height } = page.getSize()

    // 2.1 Fuentes ---------------------------------------------------------------------------
    const font      = await pdf.embedFont(StandardFonts.Helvetica)
    const fontBold  = await pdf.embedFont(StandardFonts.HelveticaBold)

    // 2.2 Variables de estilo ---------------------------------------------------------------
    const MARGIN_X     = 50              // margen lateral
    const LINE_HEIGHT  = 14              // salto de línea base
    const SMALL_GAP    = 4               // espacio reducido entre líneas
    const SECTION_GAP  = 20              // espacio entre secciones grandes

    // 🔧 Helper para limpiar texto de caracteres fuera de WinAnsi ---------------------------
    const sanitize = txt => txt
      .replace(/[\u2010-\u2015]/g, '-') // distintos guiones unicode → guion ASCII
      .replace(/[\u00A0\u202F]/g, ' ')  // espacios irrompibles → espacio normal

    // Helper para dibujar texto -------------------------------------------------------------
    let cursorY = height - SECTION_GAP   // comenzamos un poco más abajo del borde
    const drawText = (raw, { size = 12, bold = false, align = 'left' } = {}) => {
      const txt = sanitize(String(raw ?? ''))
      const fnt = bold ? fontBold : font
      const textWidth = fnt.widthOfTextAtSize(txt, size)
      let x = MARGIN_X
      if (align === 'center') x = (width - textWidth) / 2
      if (align === 'right')  x = width - MARGIN_X - textWidth
      page.drawText(txt, { x, y: cursorY, size, font: fnt, color: rgb(0, 0, 0) })
      cursorY -= size + SMALL_GAP
    }

    // 2.3 Logo ------------------------------------------------------------------------------
    const logoUrl   = 'https://static.wixstatic.com/media/acc6a6_c04fbb5b936a414fbfe6e4fe977a813b~mv2.png'
    const logoBytes = await fetch(logoUrl).then(res => res.arrayBuffer())
    const logoImg   = await pdf.embedPng(logoBytes)

    // Escalamos el logo a un ancho de ~150 pt como máximo ----------------------------------
    const desiredLogoW = 150
    const scaleFactor  = desiredLogoW / logoImg.width
    const logoDims     = logoImg.scale(scaleFactor)
    const logoX        = (width - logoDims.width) / 2
    const logoY        = cursorY - logoDims.height + 6 // pequeño ajuste visual

    page.drawImage(logoImg, {
      x: logoX,
      y: logoY,
      width: logoDims.width,
      height: logoDims.height,
    })

    // Movemos cursor justo debajo del logo --------------------------------------------------
    cursorY = logoY - SECTION_GAP

    // 2.4 Cabecera de contacto --------------------------------------------------------------
    drawText('Atitlán Rest y Café',      { size: 14, bold: true,  align: 'center' })
    drawText('Oficina de RRHH',          { size: 12,             align: 'center' })
    drawText('+502 2268-1254 ext 102',   { size: 10,             align: 'center' })
    drawText('keily_rrhh@atitlanrestaurantes.com', { size: 10, align: 'center' })

    // Espacio antes del cuerpo --------------------------------------------------------------
    cursorY -= SECTION_GAP

    // 2.5 Datos principales -----------------------------------------------------------------
    drawText('ORDEN DE PAGO', { size: 16, bold: true })
    drawText(`Folio: ${op.folio}`)
    drawText(`Colaborador: ${op.colaborador.nombres} ${op.colaborador.apellidos} (${op.colaborador.id_publico})`)
    drawText(`Periodo: ${op.periodo}    Frecuencia: ${op.frecuencia}`)
    drawText(`Del ${op.fecha_inicio} al ${op.fecha_fin} | Pago esperado: ${op.fecha_pago_esperada}`)

    // 2.6 Resumen ---------------------------------------------------------------------------
    cursorY -= SMALL_GAP
    drawText('RESUMEN', { bold: true })

    const money = n => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
    drawText(`Bruto:         ${money(op.bruto)}`)
    drawText(`Adelantos:     ${money(op.adelantos)}`)
    drawText(`Otros desc.:   ${money(op.otros_descuentos)}`)
    drawText(`NETO A PAGAR:  ${money(op.neto)}`, { bold: true })

    // 2.7 Área de firmas -------------------------------------------------------------------
    cursorY -= SECTION_GAP

    const drawSignatureLine = (label, xStart) => {
      const lineY = cursorY
      page.drawLine({
        start: { x: xStart, y: lineY },
        end:   { x: xStart + 210, y: lineY },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      })
      page.drawText(sanitize(label), {
        x: xStart + 60,
        y: lineY - 12,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      })
    }

    // Primera fila de firmas
    drawSignatureLine('Colaborador',           MARGIN_X)
    drawSignatureLine('Aprobó (RH/Finanzas)',  width - MARGIN_X - 210)
    // Segunda fila
    cursorY -= SECTION_GAP
    drawSignatureLine('Entregado por',         MARGIN_X)
    drawSignatureLine('Recibido por',          width - MARGIN_X - 210)

    // 2.8 Fecha de emisión -----------------------------------------------------------------
    cursorY -= SECTION_GAP / 1.5
    drawText(`Emitido: ${op.created_at.toString().slice(0, 10)}`, { size: 10 })

    // 3. Devolvemos el PDF -----------------------------------------------------------------
    const pdfBytes = await pdf.save()
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${op.folio}.pdf"`,
      },
    })
  } catch (e) {
    console.error('PDF Error:', e)
    return NextResponse.json({ error: e.message || 'Error al generar PDF' }, { status: 500 })
  }
}
