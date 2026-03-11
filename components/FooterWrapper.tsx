'use client'

import { usePathname } from 'next/navigation'

export default function FooterWrapper() {
  const pathname = usePathname()
  const sinFooter = pathname.startsWith('/scanner')
  if (sinFooter) return null

  return (
    <footer style={{
      background:  'var(--color-stone)',
      color:       'var(--color-dust)',
      padding:     'var(--space-xl) var(--space-md) var(--space-lg)',
      marginTop:   'var(--space-xl)',
      borderTop:   '2px solid var(--color-primary)',
    }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize:   '0.95rem',
          margin:      0,
          color:      'var(--color-parchment)',
          opacity:     1,
        }}>
          Un proyecto de memoria colectiva y cooperativismo
        </p>
        <p style={{
          fontSize:  '0.85rem',
          marginTop: 'var(--space-xs)',
          opacity:    0.8,
          color:     'var(--color-parchment)',
        }}>
          © {new Date().getFullYear()} Recorremos Memoria
        </p>
      </div>
    </footer>
  )
}