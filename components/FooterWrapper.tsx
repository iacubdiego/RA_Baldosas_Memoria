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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes salpicado {
          0%   { opacity: 0; transform: scale(0.6) rotate(-3deg); filter: blur(4px); }
          20%  { opacity: 1; transform: scale(1.05) rotate(1deg); filter: blur(0); }
          30%  { opacity: 0.7; transform: scale(1) rotate(0deg); filter: blur(0); }
          80%  { opacity: 0.7; transform: scale(1) rotate(0deg); filter: blur(0); }
          100% { opacity: 0; transform: scale(0.95) rotate(2deg); filter: blur(2px); }
        }
        .footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .footer-creditos {
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          gap: 2rem;
          width: 100%;
        }
        @media (min-width: 768px) {
          .footer-grid {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: flex-start;
          }
          .footer-creditos {
            flex: 0 0 auto;
          }
        }
      `}} />
      <div className="footer-grid">

        {/* Columna izquierda: proyecto */}
        <div style={{ flex: '0 1 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
        </div>

        {/* Columna central: links */}
        <div style={{ flex: '0 0 auto' }}>
          <p style={{
            fontSize:      '0.88rem',
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

        {/* Columna derecha: créditos */}
        <div className="footer-creditos">
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'rgba(240,244,248,0.7)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            opacity: 0,
            animation: 'salpicado 4.5s cubic-bezier(0.25, 1, 0.5, 1) infinite',
          }}>
            gcoop
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 300,
            color: 'rgba(240,244,248,0.35)',
            lineHeight: 1,
          }}>
            +
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              fontWeight: 400,
              color: 'rgba(240,244,248,0.45)',
              letterSpacing: '0.01em',
            }}>
              Animación por
            </span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'rgba(240,244,248,0.7)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              opacity: 0,
              animation: 'salpicado 4.5s cubic-bezier(0.25, 1, 0.5, 1) 1.25s infinite',
            }}>
              malefico3d
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
