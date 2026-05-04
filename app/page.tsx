'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

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

// Generar spans aleatorios para grid masonry
function generateRandomSpans(count: number): ('tall' | 'wide' | 'normal')[] {
  return Array.from({ length: count }, () => {
    const rand = Math.random();
    if (rand < 0.3) return 'tall';
    if (rand < 0.5) return 'wide';
    return 'normal';
  });
}

// Seleccionar imágenes aleatorias de las 20 disponibles
function selectRandomImages(count: number): string[] {
  const allImages = Array.from({ length: 20 }, (_, i) => `images/slice/slice${String(i + 1).padStart(2, '0')}.jpg`);
  const selected: string[] = [];
  const indices = new Set<number>();
  
  while (selected.length < count && indices.size < allImages.length) {
    const randomIdx = Math.floor(Math.random() * allImages.length);
    if (!indices.has(randomIdx)) {
      indices.add(randomIdx);
      selected.push(allImages[randomIdx]);
    }
  }
  
  return selected;
}

// ─── Image Grid ────────────────────────────────────────────────────────────
interface GridItem {
  id: number;
  src: string;
  span: 'tall' | 'wide' | 'normal';
  animation: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  delay: number;
}

function ImageGrid() {
  const [gridItems, setGridItems] = useState<GridItem[]>([]);

  useEffect(() => {
    const itemCount = 8;
    const images = selectRandomImages(itemCount);
    const spans = generateRandomSpans(itemCount);
    const animations: ('fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn')[] = ['fadeInUp', 'fadeInLeft', 'fadeInRight', 'scaleIn'];

    const items: GridItem[] = images.map((src, i) => ({
      id: i,
      src,
      span: spans[i],
      animation: animations[i % animations.length],
      delay: i * 80,
    }));

    setGridItems(items);
  }, []);

  if (gridItems.length === 0) return null;

  return (
    <div style={{
      opacity: 0,
      animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 4.4s forwards',
      marginTop: 'var(--space-md)',
      padding: 'var(--space-md) var(--space-lg)',
      borderTop: '1px solid rgba(37, 99, 235, 0.1)',
    }}>
      <style>{`
        .grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-auto-rows: 140px;
          grid-auto-flow: dense;
          gap: 6px;
          width: 100%;
          max-width: 100%;
        }
        
        @media (min-width: 500px) {
          .grid-container {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (min-width: 800px) {
          .grid-container {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        .grid-item {
          border-radius: 8px;
          border: 0.5px solid rgba(37, 99, 235, 0.1);
          background-size: cover;
          background-position: center;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        
        .grid-item:hover {
          border-color: rgba(37, 99, 235, 0.3);
        }
        
        .grid-item.tall {
          grid-row: span 2;
        }
        
        .grid-item.wide {
          grid-column: span 2;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      
      <div className="grid-container">
        {gridItems.map((item) => (
          <div
            key={item.id}
            className={`grid-item ${item.span}`}
            style={{
              backgroundImage: `url('${item.src}')`,
              animation: `${item.animation} 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
              opacity: 0,
              animationDelay: `${item.delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [venecitas, setVenecitas] = useState<any[]>([])
  const [modalGPS, setModalGPS] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setVenecitas(generarVenecitas(32))
  }, [])

  useEffect(() => {
    return () => {
      document.body.classList.remove('home-navbar-oculta')
    }
  }, [])

  const handleEntrarMapa = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!navigator.geolocation) {
      router.push('/mapa')
      return
    }
    // Chequear si ya tiene permiso con posición cacheada
    const yaTienePermiso = await new Promise<boolean>(resolve => {
      const timeout = setTimeout(() => resolve(false), 500)
      navigator.geolocation.getCurrentPosition(
        () => { clearTimeout(timeout); resolve(true) },
        () => { clearTimeout(timeout); resolve(false) },
        { enableHighAccuracy: false, timeout: 400, maximumAge: 60000 }
      )
    })
    if (yaTienePermiso) {
      router.push('/mapa')
      return
    }
    // No tiene permiso — mostrar modal de espera y disparar diálogo nativo
    setModalGPS(true)
    navigator.geolocation.getCurrentPosition(
      () => { setModalGPS(false); router.push('/mapa') },
      () => { setModalGPS(false); router.push('/mapa') },
      { enableHighAccuracy: true, timeout: 30000 }
    )
  }, [router])

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
              
              {/* Imagen central */}
              <img 
                src="/images/logo_flores.png" 
                alt="Logo"
                className="logo-centro"
                loading="eager"
              />
              
            </div>

          </div>

          {/* CTA principal — Mapa como entrada a la experiencia */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '0 auto var(--space-md)',
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 2.5s forwards',
          }}>
            <a href="/mapa" onClick={handleEntrarMapa} style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem 2.5rem',
              background: 'linear-gradient(135deg, var(--color-stone) 0%, var(--color-concrete) 100%)',
              color: 'var(--color-parchment)',
              border: 'none',
              borderRadius: '16px',
              textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(26,42,58,0.28)',
              transition: 'all var(--transition-base)',
              gap: '0.5rem',
              maxWidth: '420px',
              width: '100%',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform = 'translateY(-3px)'
              el.style.boxShadow = '0 12px 40px rgba(26,42,58,0.38)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 8px 32px rgba(26,42,58,0.28)'
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.1rem, 3vw, 1.45rem)',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'var(--color-parchment)',
                lineHeight: 1.25,
                textAlign: 'center',
              }}>
                Entra al mapa y salí a la calle
              </span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                fontWeight: 400,
                color: 'rgba(240,244,248,0.7)',
                textAlign: 'center',
                lineHeight: 1.4,
                marginTop: '0.15rem',
              }}>
                Encontrá las baldosas más cercanas, escaneá y construí memoria.
              </span>
            </a>
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
              marginBottom: 'var(--space-md)',
              maxWidth: '600px',
              margin: '0 auto var(--space-md)',
              lineHeight: 1.8,
            }}>
              Detrás de cada baldosa hay una historia. Proponemos una guía interactiva para explorar la memoria construida a través de las baldosas por la memoria. Sé parte del recorrido marcando cada baldosa que visitas cuando la escaneas.
            </p>
          </div>

          {/* Link a colaborar */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 4.2s forwards',
            marginBottom: 'var(--space-md)',
          }}>
            <a href="/colaborar" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'var(--color-primary)',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1.5px solid rgba(37, 99, 235, 0.2)',
              background: 'rgba(37, 99, 235, 0.04)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37, 99, 235, 0.08)'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(37, 99, 235, 0.35)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37, 99, 235, 0.04)'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(37, 99, 235, 0.2)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              ¿Conocés alguna baldosa recordatorio de los/as desaparecidos/as de la última dictadura cívico militar?
            </a>
          </div>

          {/* Contador */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 4.25s forwards',
            marginBottom: 'var(--space-sm)',
          }}>
            <ContadorBaldosas />
          </div>

          {/* Image Grid — Masonry con spans aleatorios */}
          <ImageGrid />
        </div>
      </div>

      {/* ── Modal pedido de GPS ── */}
      {modalGPS && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(10,18,28,0.72)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: 'var(--color-stone)',
            borderRadius: '16px',
            padding: '1.75rem 2rem',
            maxWidth: '320px',
            width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            textAlign: 'center',
          }}>
            <div className="loading" style={{ width: '28px', height: '28px' }} />
            <p style={{
              color: 'var(--color-parchment)',
              fontSize: '0.95rem',
              fontWeight: 600,
              margin: 0,
            }}>
              Esperando permiso de ubicación…
            </p>
            <p style={{
              color: 'rgba(240,244,248,0.5)',
              fontSize: '0.8rem',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Aceptá o rechazá el permiso en el diálogo de tu navegador.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
