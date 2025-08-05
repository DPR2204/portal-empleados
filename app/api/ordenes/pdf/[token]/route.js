// app/api/ordenes/pdf/[token]/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function GET(request, { params }) {
  try {
    // ────────────────────────────────────
    // 0. Token recibido en la URL
    // ────────────────────────────────────
    const token = params.token

    // ────────────────────────────────────
    // 1. Recuperamos la orden y colaborador
    // ────────────────────────────────────
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

    // ────────────────────────────────────
    // 2. Configuración de PDF y estilo
    // ────────────────────────────────────
    const pdf  = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89]) // A4 portrait (pt)
    const { width, height } = page.getSize()

    const font     = await pdf.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

    // Dimensiones y espaciados
    const MARGIN_X       = 50
    const SMALL_GAP      = 4
    const SECTION_GAP    = 20
    const SIGNATURE_GAP  = 40 // espacio vertical entre bloques de firmas

    // Sanitizador de texto (caracteres fuera de WinAnsi)
    const clean = txt => String(txt ?? '')
      .replace(/[\u2010-\u2015]/g, '-') // guiones varios
      .replace(/[\u00A0\u202F]/g, ' ')  // espacios no‑break

    // Helper para escribir texto
    let y = height - SECTION_GAP
    const write = (raw, { size = 12, bold = false, align = 'left' } = {}) => {
      const txt = clean(raw)
      const fnt = bold ? fontBold : font
      const w   = fnt.widthOfTextAtSize(txt, size)
      let x     = MARGIN_X
      if (align === 'center') x = (width - w) / 2
      if (align === 'right')  x = width - MARGIN_X - w
      page.drawText(txt, { x, y, size, font: fnt, color: rgb(0, 0, 0) })
      y -= size + SMALL_GAP
    }

    // ────────────────────────────────────
    // 3. Logo
    // ────────────────────────────────────
    const logoUrl   = 'https://static.wixstatic.com/media/acc6a6_c04fbb5b936a414fbfe6e4fe977a813b~mv2.png'
    const logoBytes = await fetch(logoUrl).then(res => res.arrayBuffer())
    const logoImg   = await pdf.embedPng(logoBytes)

    const LOGO_W = 150
    const logo   = logoImg.scale(LOGO_W / logoImg.width)
    const logoX  = (width - logo.width) / 2
    const logoY  = y - logo.height + 6

    page.drawImage(logoImg, { x: logoX, y: logoY, width: logo.width, height: logo.height })

    y = logoY - SECTION_GAP

    // ────────────────────────────────────
    // 4. Encabezado de contacto
    // ────────────────────────────────────
    write('Atitlán Rest y Café', { size: 14, bold: true, align: 'center' })
    write('Oficina de RRHH',     { size: 12,           align: 'center' })
    write('+502 2268-1254 ext 102', { size: 10,        align: 'center' })
    write('keily_rrhh@atitlanrestaurantes.com', { size: 10, align: 'center' })

    y -= SECTION_GAP

    // ────────────────────────────────────
    // 5. Datos de la orden
    // ────────────────────────────────────
    write('ORDEN DE PAGO', { size: 16, bold: true })
    write(`Folio: ${op.folio}`)
    write(`Colaborador: ${op.colaborador.nombres} ${op.colaborador.apellidos} (${op.colaborador.id_publico})`)
    write(`Periodo: ${op.periodo}    Frecuencia: ${op.frecuencia}`)
    write(`Del ${op.fecha_inicio} al ${op.fecha_fin} | Pago esperado: ${op.fecha_pago_esperada}`)

    y -= SMALL_GAP
    write('RESUMEN', { bold: true })
    const money = n => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
    write(`Bruto:         ${money(op.bruto)}`)
    write(`Adelantos:     ${money(op.adelantos)}`)
    write(`Otros desc.:   ${money(op.otros_descuentos)}`)
    write(`NETO A PAGAR:  ${money(op.neto)}`, { bold: true })

    // ────────────────────────────────────
    // 6. Área de firmas
    // ────────────────────────────────────
    y -= SECTION_GAP

    const drawSigLine = (label, xStart) => {
      const lineY = y
      // Línea
      page.drawLine({
        start: { x: xStart,            y: lineY },
        end:   { x: xStart + 210,      y: lineY },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      })
      // Etiqueta
      page.drawText(clean(label), {
        x: xStart + 60,
        y: lineY - 12,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      })
    }

    // Fila 1
    drawSigLine('Colaborador',          MARGIN_X)
    drawSigLine('Aprobó (RH/Finanzas)', width - MARGIN_X - 210)
    y -= SIGNATURE_GAP

    // Fila 2
    drawSigLine('Entregado por',        MARGIN_X)
    drawSigLine('Recibido por',         width - MARGIN_X - 210)
    y -= SIGNATURE_GAP

    // ────────────────────────────────────
    // 7. Fecha de emisión
    // ────────────────────────────────────
    write(`Emitido: ${op.created_at.toString().slice(0, 10)}`, { size: 10 })

    // ────────────────────────────────────
    // 8. Salida
    // ────────────────────────────────────
    const bytes = await pdf.save()
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${op.folio}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF Error:', err)
    return NextResponse.json({ error: err.message || 'Error al generar PDF' }, { status: 500 })
  }
}
