import Link from 'next/link'

export default function Home() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-lg)',
    }}>
      <div className="container" style={{ textAlign: 'center', maxWidth: '900px' }}>
        <div className="animate-fade-in-up">
          <h1 style={{
            marginBottom: 'var(--space-lg)',
            background: 'linear-gradient(135deg, var(--color-stone) 0%, var(--color-bronze) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Baldosas por la Memoria
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--color-concrete)',
            marginBottom: 'var(--space-xl)',
            maxWidth: '600px',
            margin: '0 auto var(--space-xl)',
            lineHeight: 1.8,
          }}>
            Recorre las baldosas de la memoria que honran a las víctimas de la última dictadura militar argentina (1976-1983). 
            Cada baldosa es un testimonio de nuestra historia.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-xl)',
            padding: 'var(--space-lg)',
            background: 'rgba(42, 37, 32, 0.03)',
            borderRadius: '4px',
            border: '1px solid rgba(42, 37, 32, 0.1)',
          }}>
            <div>
              <div style={{
                fontSize: '2.5rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: 'var(--color-terracota)',
              }}>
                30.000
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: 'var(--color-dust)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: 'var(--space-xs)',
              }}>
                Desaparecidos
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '2.5rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: 'var(--color-bronze)',
              }}>
                AR
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: 'var(--color-dust)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: 'var(--space-xs)',
              }}>
                Tecnología
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '2.5rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: 'var(--color-brass)',
              }}>
                Nunca Más
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: 'var(--color-dust)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: 'var(--space-xs)',
              }}>
                Memoria
              </div>
            </div>
          </div>

          <div className="cluster" style={{ justifyContent: 'center', marginBottom: 'var(--space-lg)' }}>
            <Link href="/mapa" className="btn" style={{
              background: 'var(--color-terracota)',
              color: 'var(--color-parchment)',
              border: 'none',
              padding: 'var(--space-md) var(--space-lg)',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: 'var(--shadow-medium)',
            }}>
              Explorar Mapa
            </Link>
            
            <Link href="/scanner" className="btn" style={{
              padding: 'var(--space-md) var(--space-lg)',
              fontSize: '1rem',
            }}>
              Escanear Baldosa
            </Link>
          </div>
        </div>

        <div className="animate-fade-in" style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-lg)',
          borderTop: '1px solid rgba(42, 37, 32, 0.1)',
          animationDelay: '200ms',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>
            Memoria, Verdad y Justicia
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-lg)',
            marginTop: 'var(--space-md)',
            textAlign: 'left',
          }}>
            <div>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'var(--color-terracota)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: 'var(--space-sm)',
              }}>
                1
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-xs)' }}>
                Descubre las Baldosas
              </h3>
              <p style={{ color: 'var(--color-dust)', fontSize: '0.95rem' }}>
                Explora el mapa con las baldosas que honran a víctimas de la dictadura
              </p>
            </div>

            <div>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'var(--color-bronze)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: 'var(--space-sm)',
              }}>
                2
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-xs)' }}>
                Escanea en Realidad Aumentada
              </h3>
              <p style={{ color: 'var(--color-dust)', fontSize: '0.95rem' }}>
                Usa tu cámara para ver información sobre cada persona homenajeada
              </p>
            </div>

            <div>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'var(--color-brass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: 'var(--space-sm)',
              }}>
                3
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-xs)' }}>
                Mantén Viva la Memoria
              </h3>
              <p style={{ color: 'var(--color-dust)', fontSize: '0.95rem' }}>
                Conoce las historias de quienes lucharon por la libertad y la justicia
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
