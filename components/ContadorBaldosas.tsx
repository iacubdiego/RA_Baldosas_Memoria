/**
 * ContadorBaldosas.tsx — Server Component
 * ─────────────────────────────────────────
 * Muestra el total de baldosas activas en la DB.
 *
 * Ubicación en app/page.tsx — DESPUÉS del bloque Memorial Statement:
 *
 *   {/* Memorial Statement - Solo "Nunca Más" *\/}
 *   <div className="memorial-statement animate-fade-in-scale delay-300">
 *     ...
 *   </div>
 *
 *   <ContadorBaldosas />     ← acá
 *
 *   {/* Botones de acción *\/}
 *
 * Importar con:
 *   import ContadorBaldosas from '@/components/ContadorBaldosas'
 */

import connectDB from '@/lib/mongodb'
import Baldosa from '@/models/Baldosa'

export const revalidate = 60

async function obtenerTotal(): Promise<number> {
  try {
    await connectDB()
    return await Baldosa.countDocuments({ activo: true })
  } catch {
    return 0
  }
}

export default async function ContadorBaldosas() {
  const total = await obtenerTotal()
  if (total === 0) return null

  return (
    <div
      className="animate-fade-in-up"
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '0.5rem',
        margin:         'var(--space-md) auto var(--space-lg)',
        padding:        '0.55rem 1.4rem',
        background:     'rgba(37, 99, 235, 0.06)',
        border:         '1px solid rgba(37, 99, 235, 0.18)',
        borderRadius:   '24px',
        width:          'fit-content',
      }}
    >
      <span style={{ fontSize: '1rem' }}>🏛️</span>
      <span style={{
        fontFamily:    'var(--font-display)',
        fontSize:      '1.05rem',
        fontWeight:    700,
        color:         'var(--color-primary)',
      }}>
        {total.toLocaleString('es-AR')}
      </span>
      <span style={{
        fontSize:   '0.88rem',
        color:      'var(--color-dust)',
        fontWeight: 500,
      }}>
        baldosas en la base
      </span>
    </div>
  )
}
