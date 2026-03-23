'use client'

import { usePathname } from 'next/navigation'

export default function FooterWrapper() {
  const pathname = usePathname()
  const sinFooter = pathname.startsWith('/scanner') || pathname.startsWith('/mapa')
  if (sinFooter) return null

  return (
    <footer style={{
      background: 'var(--color-stone)',
      color:      'var(--color-parchment)',
      borderTop:  '2px solid var(--color-primary)',
    }}>
      <div style={{
        maxWidth:       '1200px',
        margin:         '0 auto',
        padding:        '2.5rem 1.5rem 2rem',
        display:        'flex',
        flexWrap:       'wrap',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        gap:            '2rem',
      }}>

        {/* Columna izquierda: proyecto */}
        <div style={{ flex: '1 1 240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <img
              src="/images/logo_flores.png"
              alt="Recorremos Memoria"
              style={{ width: '70px', height: '70px', objectFit: 'contain' }}
            />
            <span style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '2.1rem',
              fontWeight:    700,
              color:         'var(--color-parchment)',
              letterSpacing: '-0.01em',
            }}>
              Recorremos Memoria
            </span>
          </div>
          <p style={{
            fontSize:   '0.83rem',
            lineHeight: 1.65,
            color:      'rgba(240,244,248,0.6)',
            margin:     0,
            maxWidth:   '280px',
          }}>

          </p>
        </div>

        {/* Columna central: links */}
        <div style={{ flex: '0 0 auto' }}>
          <p style={{
            fontSize:      '0.68rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color:         'rgba(240, 244, 248, 0.8)',
            margin:        '0 0 0.75rem',
            fontFamily:    'var(--font-body)',
            fontWeight:    600,
          }}>
          Un aporte de gcoop a la campaña para abrazar la memoria de:
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              { href: 'https://www.instagram.com/casanuestroshijos',           label: 'Madres de Plaza de Mayo Linea Fundadora' },
              { href: 'https://www.instagram.com/abuelasdifusion',  label: 'Abuelas de Plaza de Mayo' },
              { href: 'https://www.instagram.com/h.i.j.o.s._capital',  label: 'H.I.J.O.S. Capital' },
              { href: 'https://www.instagram.com/familiares_cap',  label: 'Familiares de Desaparecidos' },
              { href: 'https://www.instagram.com/cels_argentina',  label: 'CELS' },
            ].map(({ href, label }) => (
              <a key={href} href={href} style={{
                color:          'rgba(240,244,248,0.65)',
                fontSize:       '0.88rem',
                textDecoration: 'none',
                transition:     'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,244,248,0.65)')}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
