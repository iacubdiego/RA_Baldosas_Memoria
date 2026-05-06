'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
      lado = Math.floor(Math.random() * 4);
      
      if (lado === 0) {
        x = Math.random() * 90 + 5;
        y = Math.random() * 10 + 2;
      } else if (lado === 1) {
        x = Math.random() * 90 + 5;
        y = Math.random() * 10 + 86;
      } else if (lado === 2) {
        x = Math.random() * 10 + 3;
        y = Math.random() * 60 + 20;
      } else {
        x = Math.random() * 10 + 87;
        y = Math.random() * 60 + 20;
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

// ─── Layout Definitions ────────────────────────────────────────────────────
interface LayoutConfig {
  id: number;
  items: Array<{
    id: string;
    area: string;
  }>;
}

const LAYOUTS: LayoutConfig[] = [
  {
    id: 1,
    items: [
      { id: 'div1', area: '1 / 1 / 2 / 3' },
      { id: 'div2', area: '1 / 3 / 2 / 4' },
      { id: 'div3', area: '2 / 1 / 4 / 2' },
      { id: 'div4', area: '2 / 2 / 4 / 4' },
    ]
  },
  {
    id: 2,
    items: [
      { id: 'div1', area: '1 / 1 / 3 / 3' },
      { id: 'div2', area: '1 / 3 / 3 / 4' },
      { id: 'div3', area: '3 / 2 / 4 / 4' },
      { id: 'div4', area: '3 / 1 / 4 / 2' },
    ]
  },
  {
    id: 3,
    items: [
      { id: 'div1', area: '1 / 1 / 3 / 2' },
      { id: 'div2', area: '1 / 2 / 2 / 3' },
      { id: 'div3', area: '1 / 2 / 2 / 4' },
      { id: 'div4', area: '3 / 1 / 4 / 2' },
      { id: 'div5', area: '2 / 2 / 4 / 4' },
    ]
  },
  {
    id: 4,
    items: [
      { id: 'div1', area: '1 / 1 / 3 / 2' },
      { id: 'div2', area: '3 / 1 / 4 / 3' },
      { id: 'div3', area: '1 / 2 / 3 / 4' },
      { id: 'div4', area: '3 / 3 / 4 / 4' },
    ]
  }
];

// Seleccionar imágenes locales sin repetición
function selectRandomImages(count: number): string[] {
  const allImages = Array.from({ length: 20 }, (_, i) => `images/slice/slice${String(i + 1).padStart(2, '0')}.jpg`);
  const selected: string[] = [];
  const usedIndices = new Set<number>();
  
  while (selected.length < count && usedIndices.size < allImages.length) {
    const randomIdx = Math.floor(Math.random() * allImages.length);
    if (!usedIndices.has(randomIdx)) {
      usedIndices.add(randomIdx);
      selected.push(allImages[randomIdx]);
    }
  }
  
  return selected;
}

// ─── Grid Item Component ────────────────────────────────────────────────────
interface GridItemProps {
  images: string[];
  area: string;
  index: number;
}

function GridItem({ images, area, index }: GridItemProps) {
  // Cada item comienza con offset inicial
  const initialPhotoIdx = index % Math.max(1, images.length);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(initialPhotoIdx);
  const [isHovering, setIsHovering] = useState(false);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Direcciones de animación variadas
  const directions = ['from-left', 'from-right', 'from-top', 'from-bottom'];
  const slideDirection = directions[index % directions.length];
  const itemInitialDelay = index * 200; // 200ms entre cada item

  // Auto-cycle con pausa en hover - comienza con delay diferenciado
  useEffect(() => {
    if (isHovering) {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
      return;
    }

    // Cada item comienza su ciclo en diferente tiempo
    const initialTimeout = setTimeout(() => {
      cycleTimerRef.current = setInterval(() => {
        setCurrentPhotoIdx(prev => (prev + 1) % images.length);
      }, 5000); // Cicla cada 5s
    }, itemInitialDelay); // Delay inicial diferenciado

    return () => {
      clearTimeout(initialTimeout);
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [isHovering, images.length, itemInitialDelay]);

  // Preload imágenes
  useEffect(() => {
    images.forEach((img) => {
      const image = new Image();
      image.src = img;
    });
  }, [images]);

  const currentImage = images[currentPhotoIdx];

  return (
    <div
      className="grid-item"
      style={{
        gridArea: area,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="grid-image-wrapper">
        <img
          src={currentImage}
          alt={`Baldosa ${index + 1} - foto ${currentPhotoIdx + 1}`}
          className={`grid-image ${slideDirection}`}
          style={{
            animationDelay: `${itemInitialDelay}ms`,
          }}
        />
      </div>

      {/* Overlay */}
      <div className="grid-overlay">
        <div className="grid-info">
          <div className="grid-label">Baldosa</div>
        </div>
      </div>
    </div>
  );
}

// ─── Image Grid ────────────────────────────────────────────────────────
function ImageGrid() {
  const [layout, setLayout] = useState<LayoutConfig | null>(null);
  const [images, setImages] = useState<string[][]>([]);

  useEffect(() => {
    const randomLayout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    setLayout(randomLayout);
    
    // Seleccionar TODAS las imágenes únicas necesarias de una sola vez
    const itemCount = randomLayout.items.length;
    const imagesPerItem = 2;
    const totalNeeded = itemCount * imagesPerItem;
    
    // Pool global de imágenes disponibles
    const allImages = Array.from({ length: 20 }, (_, i) => `images/slice/slice${String(i + 1).padStart(2, '0')}.jpg`);
    
    // Mezclar y seleccionar imágenes únicas (sin repetición)
    const shuffled = allImages.sort(() => Math.random() - 0.5);
    const selectedImages = shuffled.slice(0, totalNeeded);
    
    // Distribuir imágenes entre items (cada item obtiene imagesPerItem imágenes)
    const distributedImages = randomLayout.items.map((_, idx) => {
      const start = idx * imagesPerItem;
      const end = start + imagesPerItem;
      return selectedImages.slice(start, end);
    });
    
    setImages(distributedImages);
  }, []);

  if (!layout || images.length === 0) return null;

  return (
    <div
      style={{
        opacity: 0,
        animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 4.4s forwards',
        marginTop: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        width: 'calc(100% + 2 * var(--space-lg))',
        marginLeft: 'calc(-1 * var(--space-lg))',
        marginRight: 'calc(-1 * var(--space-lg))',
        paddingLeft: 'var(--space-lg)',
        paddingRight: 'var(--space-lg)',
        paddingTop: 'var(--space-md)',
        paddingBottom: 'var(--space-md)',
        display: 'flex',
        justifyContent: 'center',
        borderTop: '1px solid rgba(37, 99, 235, 0.1)',
      }}
    >
      <style>{`
        .grid-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(5, 1fr);
          gap: 6px;
          width: 100%;
          aspect-ratio: 1 / 1;
          max-width: 800px;
        }
        
        @media (min-width: 600px) {
          .grid-container {
            gap: 10px;
          }
        }
        
        @media (min-width: 900px) {
          .grid-container {
            gap: 12px;
          }
        }
        
        .grid-item {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(37, 99, 235, 0.15);
          box-shadow: 0 2px 8px rgba(26, 42, 58, 0.08);
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          outline: 2px solid transparent;
          outline-offset: 2px;
        }
        
        .grid-item:hover {
          border-color: rgba(37, 99, 235, 0.3);
          box-shadow: 0 8px 24px rgba(26, 42, 58, 0.15);
          transform: translateY(-4px);
        }
        
        .grid-item:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
        
        .grid-image-wrapper {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .grid-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .grid-image.from-left {
          animation: slideInFromLeft 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        
        .grid-image.from-right {
          animation: slideInFromRight 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        
        .grid-image.from-top {
          animation: slideInFromTop 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        
        .grid-image.from-bottom {
          animation: slideInFromBottom 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .grid-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(26, 42, 58, 0.5) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: flex-end;
          padding: 12px;
          z-index: 2;
        }
        
        .grid-item:hover .grid-overlay {
          opacity: 1;
        }
        
        .grid-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .grid-label {
          color: var(--color-parchment);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.03em;
          line-height: 1.2;
        }
      `}</style>

      <div className="grid-container">
        {layout.items.map((item, idx) => (
          <GridItem
            key={item.id}
            images={images[idx] || []}
            area={item.area}
            index={idx}
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
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          
          <div className="logo-baldosa-container">
            <div className="baldosa-animada">
              <img 
                src="/images/baldoson.jpg" 
                alt="Baldosa"
                className="baldosa-img"
                loading="eager"
              />
              
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
              
              <img 
                src="/images/logo_flores.png" 
                alt="Logo"
                className="logo-centro"
                loading="eager"
              />
            </div>
          </div>

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

          {/* Contenedor flex: Contador + Bloque inspiracional - ANTES del grid */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 4.3s forwards',
            marginTop: 'var(--space-xl)',
            marginBottom: 'var(--space-lg)',
            display: 'flex',
            gap: 'var(--space-lg)',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: '1000px',
            margin: 'var(--space-lg) auto var(--space-lg)',
            padding: '0 var(--space-md)',
          }}>
            {/* Bloque Contador */}
            <div style={{
              flex: '1 1 280px',
              minWidth: '260px',
              padding: 'var(--space-lg) var(--space-lg)',
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: 'clamp(1rem, 3vw, 1.3rem)',
                fontWeight: 700,
                color: 'var(--color-stone)',
                letterSpacing: '0.02em',
                margin: 0,
                lineHeight: 1.3,
              }}>
                Más de 500 baldosas registradas
              </p>
            </div>

            {/* Bloque Inspiracional */}
            <div style={{
              flex: '1 1 280px',
              minWidth: '260px',
              padding: 'var(--space-lg) var(--space-lg)',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%)',
              border: '2px solid rgba(37, 99, 235, 0.2)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                fontWeight: 700,
                color: 'var(--color-stone)',
                letterSpacing: '-0.02em',
                margin: '0 0 var(--space-xs) 0',
                lineHeight: 1.2,
              }}>
                Saliendo a la calle
              </h2>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                fontWeight: 600,
                color: 'var(--color-primary)',
                letterSpacing: '-0.01em',
                margin: 0,
                lineHeight: 1.3,
              }}>
                Recorremos memoria
              </p>
            </div>
          </div>

          {/* Grid de imágenes */}
          <ImageGrid />
        </div>
      </div>

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
