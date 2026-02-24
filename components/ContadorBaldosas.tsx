/**
 * ContadorBaldosas.tsx
 * ─────────────────────
 * Server Component: muestra el total de baldosas activas en la DB.
 * Se usa en app/page.tsx entre la descripción y el "Nunca Más".
 *
 * Uso en page.tsx:
 *   import ContadorBaldosas from '@/components/ContadorBaldosas'
 *   ...
 *   <ContadorBaldosas />
 */

import connectDB from '@/lib/mongodb'
import Baldosa from '@/models/Baldosa'

// Revalida cada 60 segundos
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
      className="animate-fade-in-up delay-250"
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '0.5rem',
        margin:         '0 auto var(--space-lg)',
        padding:        '0.55rem 1.25rem',
        background:     'rgba(37, 99, 235, 0.06)',
        border:         '1px solid rgba(37, 99, 235, 0.18)',
        borderRadius:   '24px',
        width:          'fit-content',
      }}
    >
      <span style={{ fontSize: '1rem' }}>🏛️</span>
      <span style={{
        fontFamily:    'var(--font-display)',
        fontSize:      '1rem',
        fontWeight:    700,
        color:         'var(--color-primary)',
        letterSpacing: '-0.01em',
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
