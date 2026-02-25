'use client'

/**
 * ContadorBaldosas.tsx — Client Component
 * Uso en app/page.tsx después del bloque {/* Memorial Statement *\/}
 *
 *   import ContadorBaldosas from '@/components/ContadorBaldosas'
 *   ...
 *   </div>  ← cierre del memorial-statement
 *   <ContadorBaldosas />
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
    <div style={{
      margin:    'var(--space-lg) auto var(--space-xl)',
      textAlign: 'center',
      padding:   'var(--space-lg) var(--space-md)',
      background: 'rgba(37, 99, 235, 0.05)',
      border:    '1px solid rgba(37, 99, 235, 0.15)',
      borderRadius: '16px',
      maxWidth:  '400px',
    }}>
      <div style={{
        fontFamily:    'var(--font-display)',
        fontSize:      'clamp(2.8rem, 8vw, 4rem)',
        fontWeight:     800,
        color:         'var(--color-primary)',
        lineHeight:     1,
        letterSpacing: '-0.03em',
      }}>
        {total.toLocaleString('es-AR')}
      </div>
      <div style={{
        fontSize:      '1rem',
        color:         'var(--color-stone)',
        fontWeight:     600,
        marginTop:     '0.4rem',
        letterSpacing: '0.02em',
      }}>
        baldosas honran a víctimas
      </div>
      <div style={{
        fontSize:   '0.85rem',
        color:      'var(--color-dust)',
        marginTop:  '0.2rem',
      }}>
        de la última dictadura en Buenos Aires
      </div>
    </div>
  )
}
