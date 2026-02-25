'use client'

/**
 * ContadorBaldosas.tsx — Client Component
 * ─────────────────────────────────────────
 * Obtiene el total de baldosas via /api/baldosas/count
 * (nunca toca MongoDB directamente desde el cliente).
 *
 * Uso en app/page.tsx, después del bloque Memorial Statement:
 *
 *   import ContadorBaldosas from '@/components/ContadorBaldosas'
 *   ...
 *   </div>  ← cierre del memorial-statement
 *
 *   <ContadorBaldosas />
 *
 *   {/* Botones de acción *\/}
 */

import { useEffect, useState } from 'react'

export default function ContadorBaldosas() {
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/baldosas/count')
      .then(r => r.json())
      .then(d => setTotal(d.total ?? null))
      .catch(() => {})
  }, [])

  if (!total) return null

  return (
    <div
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
        fontFamily: 'var(--font-display)',
        fontSize:   '1.05rem',
        fontWeight:  700,
        color:      'var(--color-primary)',
      }}>
        {total.toLocaleString('es-AR')}
      </span>
      <span style={{
        fontSize:   '0.88rem',
        color:      'var(--color-dust)',
        fontWeight:  500,
      }}>
        baldosas en la base
      </span>
    </div>
  )
}
