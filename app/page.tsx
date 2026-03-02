'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

import ContadorBaldosas from '@/components/ContadorBaldosas'

// Generar posiciones aleatorias para venecitas en el perímetro
function generarVenecitas(cantidad: number) {
  const venecitas = [];
  const usados: {x: number, y: number}[] = [];
  
  for (let i = 0; i < cantidad; i++) {
    let x: number = 0;
    let y: number = 0;
    let lado: number = 0;
    let intentos = 0;
    let posicionValida = false;
    
    do {
      // Elegir un lado del perímetro (0: arriba, 1: abajo, 2: izquierda, 3: derecha)
      lado = Math.floor(Math.random() * 4);
      
      if (lado === 0) { // Arriba — toda la franja superior
        x = Math.random() * 90 + 5; // 5% a 95% (cubre todo el ancho)
        y = Math.random() * 10 + 2; // 2% a 12%
      } else if (lado === 1) { // Abajo — toda la franja inferior
        x = Math.random() * 90 + 5; // 5% a 95%
        y = Math.random() * 10 + 86; // 86% a 96%
      } else if (lado === 2) { // Izquierda
        x = Math.random() * 10 + 3; // 3% a 13%
        y = Math.random() * 60 + 20; // 20% a 80%
      } else { // Derecha
        x = Math.random() * 10 + 87; // 87% a 97%
        y = Math.random() * 60 + 20; // 20% a 80%
      }
      
      posicionValida = !usados.some(u => Math.abs(u.x - x) < 6 && Math.abs(u.y - y) < 7);
      intentos++;
    } while (!posicionValida && intentos < 50);
    
    if (posicionValida) {
      usados.push({x, y});
      
      const rotacion = Math.random() * 30 - 15;
      const delay = 3.0 + Math.random() * 1.5;
      const imgNum = (i % 8) + 1;
      
      venecitas.push({
        id: i,
        imgNum,
        x,
        y,
        rotacion,
        delay
      });
    }
  }
  
  return venecitas;
}

export default function Home() {
  const [venecitas, setVenecitas] = useState<any[]>([]);
  
  useEffect(() => {
    setVenecitas(generarVenecitas(16));
  }, []);

  useEffect(() => {
    return () => {
      document.body.classList.remove('home-navbar-oculta')
    }
  }, [])

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
        <div className="container" style={{ textAlign: 'center', maxWidth: '900px', width: '100%' }}>
          
          {/* Logo con animación de baldosa que se levanta */}
          <div className="logo-baldosa-container">

            {/* Baldosa que se levanta desde el piso */}
            <div className="baldosa-animada">
              <img 
                src="/images/baldoson.jpg" 
                alt="Baldosa"
                className="baldosa-img"
                loading="eager"
              />
              
              {/* Venecitas que aparecen en el perímetro */}
              <div className="venecitas-container">
                {venecitas.map((v) => (
                  <img 
                    key={v.id}
                    src={`/venecitas/venecita0${v.imgNum}.png`}
                    alt="" 
                    className="venecita"
                    loading="eager"
                    style={{
                      left: `${v.x}%`,
                      top: `${v.y}%`,
                      transform: `translate(-50%, -50%) rotate(${v.rotacion}deg)`,
                      animationDelay: `${v.delay}s`,
                    }}
                  />
                ))}
              </div>
              
              {/* Imagen central - Nunca Más */}
              <img 
                src="/images/logo_flores.png" 
                alt="Logo"
                className="nuncamas-centro"
                loading="eager"
              />
              
            </div>

          </div>

          {/* Botones de acción — debajo del baldosón */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            margin: '0 auto var(--space-lg)',
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 2.5s forwards',
          }}>
            {/* Botón Escanear */}
            <Link href="/scanner" style={{
              minWidth: '180px',
              height: '174px',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(to top, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 100%)',
              color: 'var(--color-dust)',
              border: 'none',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(74,107,124,0.12)',
              backdropFilter: 'blur(4px)',
              transition: 'all var(--transition-base)',
              gap: '0.4rem',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'linear-gradient(to top, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 100%)'
              el.style.boxShadow = '0 6px 28px rgba(74,107,124,0.22)'
              el.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'linear-gradient(to top, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 100%)'
              el.style.boxShadow = '0 4px 20px rgba(74,107,124,0.12)'
              el.style.transform = 'translateY(0)'
            }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--color-dust)',
              }}>Escanear</span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: 'var(--color-dust)',
                opacity: 0.85,
                textAlign: 'center',
                lineHeight: 1.3,
              }}>Descubrí la Realidad Aumentada</span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.65rem',
                fontWeight: 400,
                letterSpacing: '0.02em',
                color: 'var(--color-dust)',
                opacity: 0.6,
                textAlign: 'center',
                lineHeight: 1.35,
                marginTop: '0.25rem',
              }}>Vamos a necesitar permiso para tu cámara y ubicación por un momento</span>
            </Link>

            {/* Botón Mapa */}
            <Link href="/mapa" style={{
              minWidth: '180px',
              height: '174px',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(to top, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 100%)',
              color: 'var(--color-dust)',
              border: 'none',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(74,107,124,0.12)',
              backdropFilter: 'blur(4px)',
              transition: 'all var(--transition-base)',
              gap: '0.4rem',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'linear-gradient(to top, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 100%)'
              el.style.boxShadow = '0 6px 28px rgba(74,107,124,0.22)'
              el.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'linear-gradient(to top, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 100%)'
              el.style.boxShadow = '0 4px 20px rgba(74,107,124,0.12)'
              el.style.transform = 'translateY(0)'
            }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--color-dust)',
              }}>Mapa</span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: 'var(--color-dust)',
                opacity: 0.85,
                textAlign: 'center',
                lineHeight: 1.3,
              }}>Conocé la ubicación de las baldosas</span>
            </Link>
          </div>

          {/* Contador + Nunca Más lado a lado */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'stretch',
            margin: '0 auto var(--space-lg)',
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 3.2s forwards',
          }}>
            {/* Contador */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <ContadorBaldosas />
            </div>

            {/* Memorial Statement */}
            <div className="banner-box" style={{
              flex: 1,
              minWidth: 0,
              margin: 0,
            }}>
              <div className="banner-box-text">
                Nunca Más
              </div>
              <div className="banner-box-label">
                Memoria, Verdad y Justicia
              </div>
            </div>
          </div>

          {/* Título principal */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 3.8s forwards',
          }}>
            <h1 style={{
              marginBottom: 'var(--space-md)',
              color: 'var(--color-stone)',
            }}>
              Recorremos Memoria
            </h1>
          </div>
          
          {/* Descripción */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 4.1s forwards',
          }}>
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--color-concrete)',
              marginBottom: 'var(--space-xl)',
              maxWidth: '600px',
              margin: '0 auto var(--space-xl)',
              lineHeight: 1.8,
            }}>
              Recorre las baldosas que se colocaron en todo el país para mantener viva la memoria y exigir verdad y justicia.
            </p>
          </div>

          {/* Pasos */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 4.4s forwards',
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
              <div className="hover-lift" style={{
                padding: 'var(--space-md)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.5)',
                transition: 'all var(--transition-base)',
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--color-stone)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-parchment)',
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
                  Explora el mapa y busca las baldosas más cercanas a tu ubicación
                </p>
              </div>

              <div className="hover-lift" style={{
                padding: 'var(--space-md)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.5)',
                transition: 'all var(--transition-base)',
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--color-stone)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-parchment)',
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
                  Usa tu cámara para ver información de la baldosa y encontrar una escena sumando REALIDAD AUMENTADA
                </p>
              </div>

              <div className="hover-lift" style={{
                padding: 'var(--space-md)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.5)',
                transition: 'all var(--transition-base)',
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--color-stone)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-parchment)',
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
                  Recorre las distintas baldosas y contribuí a mantener viva la memoria de cada persona
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}