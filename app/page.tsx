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
      
      if (lado === 0) { // Arriba - solo en las esquinas, evitando el texto superior
        const esIzquierda = Math.random() > 0.5;
        if (esIzquierda) {
          x = Math.random() * 20 + 3; // 3% a 23%
        } else {
          x = Math.random() * 20 + 77; // 77% a 97%
        }
        y = Math.random() * 12 + 3; // 3% a 15%
      } else if (lado === 1) { // Abajo - solo en las esquinas, evitando el texto de fecha
        const esIzquierda = Math.random() > 0.5;
        if (esIzquierda) {
          x = Math.random() * 20 + 3; // 3% a 23%
        } else {
          x = Math.random() * 20 + 77; // 77% a 97%
        }
        y = Math.random() * 12 + 83; // 83% a 95%
      } else if (lado === 2) { // Izquierda
        x = Math.random() * 10 + 3; // 3% a 13%
        y = Math.random() * 40 + 30; // 30% a 70%
      } else { // Derecha
        x = Math.random() * 10 + 87; // 87% a 97%
        y = Math.random() * 40 + 30; // 30% a 70%
      }
      
      // Verificar que no se superponga con ninguna existente
      posicionValida = !usados.some(u => Math.abs(u.x - x) < 15 && Math.abs(u.y - y) < 20);
      intentos++;
    } while (!posicionValida && intentos < 50);
    
    // Solo agregar si encontramos una posición válida
    if (posicionValida) {
      usados.push({x, y});
      
      const rotacion = Math.random() * 30 - 15; // -15 a 15 grados
      const delay = 2.1 + Math.random() * 0.8; // 2.1s a 2.9s
      const imgNum = (i % 8) + 1; // Ciclar entre 1-8
      
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
    setVenecitas(generarVenecitas(16)); // 16 venecitas (el doble)
  }, []);

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
          
          {/* Logo con animación de baldosa que se levanta */}
          <div className="logo-baldosa-container">
            {/* Baldosa que se levanta desde el piso */}
            <div className="baldosa-animada">
              <img 
                src="/baldoson.jpg" 
                alt="Baldosa"
                className="baldosa-img"
              />
              
              {/* Venecitas que aparecen en el perímetro */}
              <div className="venecitas-container">
                {venecitas.map((v) => (
                  <img 
                    key={v.id}
                    src={`/venecitas/venecita0${v.imgNum}.png`}
                    alt="" 
                    className="venecita"
                    style={{
                      left: `${v.x}%`,
                      top: `${v.y}%`,
                      transform: `translate(-50%, -50%) rotate(${v.rotacion}deg)`,
                      animationDelay: `${v.delay}s`,
                    }}
                  />
                ))}
              </div>
              
              {/* Texto superior - Memoria, Verdad y Justicia */}
              {/* <span className="baldosa-texto-superior">
                Memoria, Verdad y Justicia
              </span> */}
              
              {/* Imagen central - Nunca Más */}
              <img 
                src="/nuncamas-avatar.jpg" 
                alt="Nunca Más"
                className="nuncamas-centro"
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
              Recorre las baldosas que se colocaron en todo el país para mantener viva la memoria y exigir verdad y justicia.
            </p>
          </div>

          <ContadorBaldosas />

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

              <Link href="/coleccion" className="btn hover-lift" style={{
                padding: 'var(--space-md) var(--space-lg)',
                fontSize: '1rem',
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
              }}>
                Mi Recorrido
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
                  Recorre las distintas baldosas y guarda fotos de donde estuviste y lo que viste
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
