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
      
      // Separación mínima reducida a la mitad (antes: 15x20)
      posicionValida = !usados.some(u => Math.abs(u.x - x) < 7.5 && Math.abs(u.y - y) < 10);
      intentos++;
    } while (!posicionValida && intentos < 50);
    
    if (posicionValida) {
      usados.push({x, y});
      
      const rotacion = Math.random() * 30 - 15;
      const delay = 3.0 + Math.random() * 1.5; // Aumentado el delay para la aparición paulatina post-baldosa
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

  // Animación de navbar: manejada por NavbarWrapper — solo limpiamos por si acaso
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

            {/* Pañuelo izquierdo */}
            <div className="lateral-panuelo lateral-panuelo-izq">
              <img src="/images/logo_solo_flores.png" alt="" className="lateral-panuelo-img" loading="eager" />
            </div>

            {/* Baldosa que se levanta desde el piso */}
            <div className="baldosa-animada">
              <img 
                src="/baldoson.jpg" 
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
              
              {/* Texto inferior - Fecha dinámica */}
              <span className="baldosa-texto-inferior">
                {new Date().toLocaleDateString('es-AR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                }).replace(/\//g, '-')}
              </span>
            </div>

            {/* Pañuelo derecho */}
            <div className="lateral-panuelo lateral-panuelo-der">
              <img src="/images/logo_solo_flores.png" alt="" className="lateral-panuelo-img" loading="eager" />
            </div>

          </div>

          {/* Título principal - Sin gradientes, más institucional */}
          <div className="animate-fade-in-up delay-100">
            <h1 style={{
              marginBottom: 'var(--space-md)',
              color: 'var(--color-stone)',
            }}>
              Recorremos Memoria
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
              Recorre las baldosas que se colocaron en todo el país para mantener viva la memoria y exigir verdad y justicia.
            </p>
          </div>

          <ContadorBaldosas />

          {/* Memorial Statement - Solo "Nunca Más", fade in elegante */}
          <div className="memorial-statement animate-fade-in-scale delay-300">
            <div className="memorial-statement-text">
              Nunca Más
            </div>
            <div className="memorial-statement-label">
              Memoria, Verdad y Justicia
            </div>
          </div>

          {/* Botones de acción */}
          <div className="animate-fade-in-up delay-400" style={{ marginTop: 'var(--space-xl)' }}>
            <div className="stack" style={{ alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <Link href="/scanner" className="btn hover-lift hover-glow" style={{
                background: 'var(--color-primary)',
                color: 'var(--color-parchment)',
                border: 'none',
                padding: 'var(--space-md) var(--space-lg)',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 'var(--shadow-medium)',
              }}>
                Encontrar Baldosa
              </Link>
              {/* Microcopy para prevenir al usuario sobre la RA */}
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--color-dust)',
                marginTop: 'var(--space-xs)',
                marginBottom: 0
              }}>
                *Se requerirá acceso a tu cámara y ubicación
              </p>
            </div>
          </div>

          {/* Pasos - Diseño más sobrio, monocromático para los números */}
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