// app/api/comprobantes/pdf/[token]/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function GET(_req, { params }) {
  try {
    const token = params.token
    if (!token) return NextResponse.json({ error:'Token requerido' }, { status:400 })

    const { data, error } = await supabaseAdmin
      .from('comprobante')
      .select(`
        folio, tipo, monto, periodo, fecha, concepto, created_at,
        colaborador:colaborador_id (nombres, apellidos, id_publico)
      `)
      .eq('verify_token', token)
      .limit(1)

    if (error) throw error
    const c = data?.[0]
    if (!c) return NextResponse.json({ error:'No encontrado' }, { status:404 })

    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89]) // A4
    const { width, height } = page.getSize()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

    const write = (txt, y, size=12, b=false, align='left') => {
      const f = b ? bold : font
      const w = f.widthOfTextAtSize(String(txt ?? ''), size)
      let x = 50
      if (align==='center') x = (width-w)/2
      if (align==='right')  x = width-50-w
      page.drawText(String(txt ?? ''), { x, y, size, font:f, color: rgb(0,0,0) })
    }

    let y = height-60
    write('COMPROBANTE', y, 16, true); y-=22
    write(`Folio: ${c.folio}`, y); y-=16
    write(`Colaborador: ${c.colaborador?.nombres ?? ''} ${c.colaborador?.apellidos ?? ''} (${c.colaborador?.id_publico ?? ''})`, y); y-=16
    write(`Tipo: ${c.tipo}    Monto: Q ${Number(c.monto||0).toLocaleString('es-GT',{minimumFractionDigits:2})}`, y); y-=16
    if (c.periodo) { write(`Periodo: ${c.periodo}`, y); y-=16 }
    if (c.fecha)   { write(`Fecha: ${c.fecha}`, y); y-=16 }
    if (c.concepto){ write(`Concepto: ${c.concepto}`, y); y-=16 }
    write(`Emitido: ${String(c.created_at).slice(0,10)}`, y, 10); y-=12

    const bytes = await pdf.save()
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${c.folio}.pdf"`
      }
    })
  } catch (err) {
    console.error('PDF comprobante error:', err)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
