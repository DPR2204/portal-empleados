import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function GET(_req, { params }) {
  try {
    // 0) Token
    const token = params.token

    // 1) Buscar comprobante + colaborador
    const { data: rows, error } = await supabaseAdmin
      .from('comprobante')
      .select(`
        verify_token,
        tipo,
        monto,
        periodo,
        fecha,
        concepto,
        created_at,
        colaborador:colaborador_id (nombres, apellidos, id_publico, email)
      `)
      .eq('verify_token', token)
      .limit(1)

    if (error) throw error
    const comp = rows?.[0]
    if (!comp) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
    }

    // 2) PDF base (A4) + helpers (igual que en órdenes)
    const pdf  = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89]) // A4 portrait
    const { width, height } = page.getSize()

    const font     = await pdf.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

    const MARGIN_X      = 50
    const SMALL_GAP     = 4
    const SECTION_GAP   = 50
    const SIGNATURE_GAP = 90

    const clean = (txt) =>
      String(txt ?? '')
        .replace(/[\u2010-\u2015]/g, '-')   // guiones raros → "-"
        .replace(/[\u00A0\u202F]/g, ' ')    // espacios no-break → espacio normal

    let y = height - SECTION_GAP
    const write = (raw, { size = 12, bold = false, align = 'left' } = {}) => {
      const txt = clean(raw)
      const f  = bold ? fontBold : font
      const w  = f.widthOfTextAtSize(txt, size)
      let x    = MARGIN_X
      if (align === 'center') x = (width - w) / 2
      if (align === 'right')  x = width - MARGIN_X - w
      page.drawText(txt, { x, y, size, font: f, color: rgb(0, 0, 0) })
      y -= size + SMALL_GAP
    }

    // 3) Logo (mismo que órdenes)
    const logoUrl   = 'https://static.wixstatic.com/media/acc6a6_c04fbb5b936a414fbfe6e4fe977a813b~mv2.png'
    const logoBytes = await fetch(logoUrl).then(res => res.arrayBuffer())
    const logoImg   = await pdf.embedPng(logoBytes)
    const LOGO_W    = 150
    const logo      = logoImg.scale(LOGO_W / logoImg.width)
    const logoX     = (width - logo.width) / 2
    const logoY     = y - logo.height + 6
    page.drawImage(logoImg, { x: logoX, y: logoY, width: logo.width, height: logo.height })
    y = logoY - SECTION_GAP

    // 4) Encabezado (igual que órdenes)
    write('Atitlán Rest y Café', { size: 14, bold: true, align: 'center' })
    write('Oficina de RRHH',     { size: 12,           align: 'center' })
    write('+502 2268-1254 ext 102', { size: 10,        align: 'center' })
    write('keily_rrhh@atitlanrestaurantes.com', { size: 10, align: 'center' })
    y -= SECTION_GAP

    // 5) Datos del comprobante
    const nombre = `${comp.colaborador?.nombres ?? ''} ${comp.colaborador?.apellidos ?? ''}`.trim()
    const money  = (n) => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
    const fecha  = comp.fecha ? new Date(comp.fecha).toLocaleDateString('es-GT') : null

    write('COMPROBANTE', { size: 16, bold: true })
    write(`Tipo: ${comp.tipo}`)
    write(`Colaborador: ${nombre} (${comp.colaborador?.id_publico ?? '-'})`)
    if (comp.colaborador?.email) write(`Email: ${comp.colaborador.email}`)
    if (comp.periodo)            write(`Periodo: ${comp.periodo}`)
    if (fecha)                   write(`Fecha: ${fecha}`)
    if (comp.concepto)           write(`Concepto: ${comp.concepto}`)
    write(`Monto: ${money(comp.monto)}`, { bold: true })

    // 6) Firmas (mismo look & feel)
    y -= SECTION_GAP
    const drawSigLine = (label, xStart) => {
      const lineY = y
      page.drawLine({
        start: { x: xStart,       y: lineY },
        end:   { x: xStart + 210, y: lineY },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      })
      page.drawText(clean(label), {
        x: xStart + 60,
        y: lineY - 12,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      })
    }
    // Fila única para comprobantes
    drawSigLine('Colaborador',          MARGIN_X)
    drawSigLine('Autorizó (RH/Finanzas)', width - MARGIN_X - 210)
    y -= SIGNATURE_GAP

    // 7) Fecha de emisión
    write(`Emitido: ${String(comp.created_at).slice(0, 10)}`, { size: 10 })

    // 8) Salida
    const bytes = await pdf.save()
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="comprobante-${comp.verify_token}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF Comprobante Error:', err)
    return NextResponse.json(
      { error: err.message || 'Error al generar PDF de comprobante' },
      { status: 500 }
    )
  }
}
