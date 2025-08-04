// app/api/colaboradores/crear/route.js
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request) {
  try {
    const body = await request.json()

    // Validar campos necesarios
    const {
      nombres,
      apellidos,
      dpi,
      email,
      telefono,
      puesto,
      sucursal,
      sueldo_base,
      frecuencia_default,
      tarifa_diaria,
      fecha_ingreso,
      estado,
    } = body

    if (!nombres || !apellidos || !dpi || !email || sueldo_base == null) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Generar un ID público único (6 caracteres)
    const shortId = randomUUID().split('-')[0].toUpperCase()
    const idPublico = `CO-${shortId}`

    // Preparar objeto a insertar
    const newCol = {
      id_publico:     idPublico,
      nombres,
      apellidos,
      dpi,
      email,
      telefono:       telefono || null,
      puesto:         puesto || null,
      sucursal:       sucursal || null,
      sueldo_base:    sueldo_base,
      frecuencia_default: frecuencia_default || 'MENSUAL',
      tarifa_diaria:  tarifa_diaria != null ? tarifa_diaria : null,
      fecha_ingreso:  fecha_ingreso || null,
      estado:         estado === true || estado === 'true',
    }

    // Insertar en Supabase
    const { data, error } = await supabaseAdmin
      .from('colaborador')
      .insert(newCol)
      .select('id_publico')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(
      { id_publico: data.id_publico },
      { status: 201 }
    )
  } catch (err) {
    console.error('API /colaboradores/crear error:', err)
    return NextResponse.json(
      { error: err.message || 'Error inesperado' },
      { status: 500 }
    )
  }
}
