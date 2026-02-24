import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Baldosa from '@/models/Baldosa'

// Cache de 5 minutos — los pins no cambian tan seguido
export const revalidate = 300

export async function GET() {
  try {
    await connectDB()

    // Solo los campos mínimos para renderizar markers en el mapa
    const baldosas = await Baldosa
      .find({ activo: true })
      .select('_id codigo nombre direccion barrio ubicacion')
      .lean()

    const pins = baldosas.map((b: any) => ({
      id:       b._id.toString(),
      codigo:   b.codigo,
      nombre:   b.nombre,
      direccion: b.direccion || '',
      barrio:   b.barrio || '',
      lat:      b.ubicacion.coordinates[1],
      lng:      b.ubicacion.coordinates[0],
    }))

    return NextResponse.json({ pins, total: pins.length })
  } catch (error) {
    console.error('Error en /api/baldosas/pins:', error)
    return NextResponse.json({ pins: [], total: 0 })
  }
}
