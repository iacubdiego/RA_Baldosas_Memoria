import Link from 'next/link'

// SVG del pañuelo de las Abuelas de Plaza de Mayo
const PanueloIcon = () => (
  <svg 
    viewBox="0 0 100 100" 
    className="panuelo-icon animate-float"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Pañuelo triangular */}
    <path 
      d="M50 20 L85 80 L15 80 Z" 
      fill="none" 
      stroke="#2563eb" 
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Nudo decorativo */}
    <ellipse 
      cx="50" 
      cy="75" 
      rx="12" 
      ry="6" 
      fill="none" 
      stroke="#2563eb" 
      strokeWidth="2"
    />
    {/* Líneas del pañuelo */}
    <path 
      d="M38 80 Q35 90 30 95" 
      fill="none" 
      stroke="#2563eb" 
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path 
      d="M62 80 Q65 90 70 95" 
      fill="none" 
      stroke="#2563eb" 
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export default function Home() {
  return (
    <div className="hero-background">
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: 'var(--space-lg)',
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '900px' }}>
          
          {/* Pañuelo Icon */}
          <div className="panuelo-container animate-fade-in">
            <PanueloIcon />
          </div>

          {/* Título principal */}
          <div className="animate-fade-in-up delay-100">
            <h1 style={{
              marginBottom: 'var(--space-md)',
              background: 'linear-gradient(135deg, var(--color-stone) 0%, var(--color-primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Baldosas por la Memoria
            </h1>
          </div>
          
          {/* Descripción */}
          <div className="animate-fade-in-up delay-200">
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
          </div>

          {/* Memorial Statement - Solo "Nunca Más" */}
          <div className="memorial-statement animate-fade-in-scale delay-300">
            <div className="memorial-statement-text animate-pulse">
              Nunca Más
            </div>
            <div className="memorial-statement-label">
              Memoria, Verdad y Justicia
            </div>
          </div>

          {/* Botones de acción */}
          <div className="animate-fade-in-up delay-400" style={{ marginTop: 'var(--space-xl)' }}>
            <div className="cluster" style={{ justifyContent: 'center', marginBottom: 'var(--space-lg)' }}>
              <Link href="/mapa" className="btn hover-lift hover-glow" style={{
                background: 'var(--color-primary)',
                color: 'var(--color-parchment)',
                border: 'none',
                padding: 'var(--space-md) var(--space-lg)',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 'var(--shadow-medium)',
              }}>
                Explorar Mapa
              </Link>
              
              <Link href="/scanner" className="btn hover-lift" style={{
                padding: 'var(--space-md) var(--space-lg)',
                fontSize: '1rem',
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
              }}>
                Escanear Baldosa
              </Link>
            </div>
          </div>

          {/* Pasos - con animaciones escalonadas */}
          <div className="animate-fade-in delay-500" style={{
            marginTop: 'var(--space-xl)',
            padding: 'var(--space-lg)',
            borderTop: '1px solid rgba(37, 99, 235, 0.1)',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)', color: 'var(--color-stone)' }}>
              ¿Cómo funciona?
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-lg)',
              textAlign: 'left',
            }}>
              <div className="animate-slide-left delay-500 hover-lift" style={{
                padding: 'var(--space-md)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.5)',
                transition: 'all var(--transition-base)',
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
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
                <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-xs)', color: 'var(--color-stone)' }}>
                  Descubre las Baldosas
                </h3>
                <p style={{ color: 'var(--color-dust)', fontSize: '0.95rem', marginBottom: 0 }}>
                  Explora el mapa con las baldosas que honran a víctimas de la dictadura
                </p>
              </div>

              <div className="animate-fade-in-up delay-600 hover-lift" style={{
                padding: 'var(--space-md)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.5)',
                transition: 'all var(--transition-base)',
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
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
                <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-xs)', color: 'var(--color-stone)' }}>
                  Escanea en Realidad Aumentada
                </h3>
                <p style={{ color: 'var(--color-dust)', fontSize: '0.95rem', marginBottom: 0 }}>
                  Usa tu cámara para ver información de la baldosa y su significado
                </p>
              </div>

              <div className="animate-slide-right delay-600 hover-lift" style={{
                padding: 'var(--space-md)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.5)',
                transition: 'all var(--transition-base)',
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
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
                <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-xs)', color: 'var(--color-stone)' }}>
                  Mantén Viva la Memoria
                </h3>
                <p style={{ color: 'var(--color-dust)', fontSize: '0.95rem', marginBottom: 0 }}>
                  Conoce las historias de quienes lucharon por la libertad y la justicia
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
