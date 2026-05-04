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

function generateRandomSpans(count: number): ('tall' | 'wide' | 'normal')[] {
  return Array.from({ length: count }, () => {
    const rand = Math.random();
    if (rand < 0.3) return 'tall';
    if (rand < 0.5) return 'wide';
    return 'normal';
  });
}

// ─── Grid Item Component ────────────────────────────────────────────────────
interface GridItemData {
  id: number;
  span: 'tall' | 'wide' | 'normal';
  animation: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  delay: number;
  nombre: string;
  barrio: string;
  fotos: string[];
}

function GridItemComponent({ item }: { item: GridItemData }) {
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imagesRef = useRef<{ [key: string]: HTMLImageElement }>({});

  const animations: ('fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn')[] = ['fadeInUp', 'fadeInLeft', 'fadeInRight', 'scaleIn'];
  const animation = animations[item.id % animations.length];
  const slideDirection = currentPhotoIdx % 2 === 0 ? 'from-left' : 'from-right';

  // Auto-cycle con pausa en hover
  useEffect(() => {
    if (isHovering) {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
      return;
    }

    cycleTimerRef.current = setInterval(() => {
      setCurrentPhotoIdx(prev => (prev + 1) % item.fotos.length);
    }, 4500);

    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [isHovering, item.fotos.length]);

  // Preload imágenes
  useEffect(() => {
    item.fotos.forEach((foto, idx) => {
      const img = new Image();
      img.src = foto;
      imagesRef.current[idx] = img;
    });
  }, [item.fotos]);

  const currentFoto = item.fotos[currentPhotoIdx];
  const fotoIsBase64 = currentFoto.startsWith('data:');

  return (
    <div
      className={`grid-item ${item.span}`}
      style={{
        animation: `${animation} 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
        opacity: 0,
        animationDelay: `${item.delay}ms`,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex={0}
      role="button"
      aria-label={`Baldosa de ${item.nombre} en ${item.barrio}`}
    >
      <div className="grid-image-wrapper">
        {fotoIsBase64 ? (
          <div
            className={`grid-image ${slideDirection}`}
            style={{
              backgroundImage: `url('${currentFoto}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ) : (
          <img
            src={currentFoto}
            alt={`${item.nombre} - foto ${currentPhotoIdx + 1}`}
            className={`grid-image ${slideDirection}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>

      {/* Overlay con micro-labels */}
      <div className="grid-overlay">
        <div className="grid-info">
          <div className="grid-label">{item.nombre}</div>
          <div className="grid-sublabel">{item.barrio}</div>
        </div>
      </div>

      {/* Indicador de múltiples fotos */}
      {item.fotos.length > 1 && (
        <div className="grid-indicator">
          {currentPhotoIdx + 1}/{item.fotos.length}
        </div>
      )}
    </div>
  );
}

// ─── Logo Filler Component ────────────────────────────────────────────────────
function LogoFiller() {
  return (
    <div
      className="grid-item-filler"
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src="/images/logo_flores.png"
        alt="Logo Recorremos Memoria"
        style={{
          width: '60%',
          height: '60%',
          objectFit: 'contain',
          opacity: 0.3,
          filter: 'drop-shadow(0 2px 4px rgba(26, 42, 58, 0.1))',
        }}
      />
    </div>
  );
}

// ─── Image Grid ────────────────────────────────────────────────────────────
interface BaldosaData {
  id: string;
  nombre: string;
  barrio?: string;
  fotosUrls?: string[];
}

function ImageGrid() {
  const [gridItems, setGridItems] = useState<GridItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBaldosas = async () => {
      try {
        const res = await fetch('/api/baldosas');
        const data = await res.json();

        if (!data.baldosas || data.baldosas.length === 0) {
          setLoading(false);
          return;
        }

        // Seleccionar 8 baldosas random
        const shuffled = [...data.baldosas].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 8);

        // Generar spans aleatorios
        const spans = generateRandomSpans(8);

        // Construir grid items con fotos
        const items: GridItemData[] = selected.map((baldosa: BaldosaData, idx: number) => {
          const fotos = baldosa.fotosUrls && baldosa.fotosUrls.length >= 2
            ? [baldosa.fotosUrls[0], baldosa.fotosUrls[1]]
            : baldosa.fotosUrls && baldosa.fotosUrls.length === 1
            ? [baldosa.fotosUrls[0], baldosa.fotosUrls[0]]
            : ['/images/placeholder.jpg', '/images/placeholder.jpg'];

          return {
            id: idx,
            span: spans[idx],
            animation: 'fadeInUp',
            delay: idx * 80,
            nombre: baldosa.nombre,
            barrio: baldosa.barrio || 'Sin especificar',
            fotos,
          };
        });

        setGridItems(items);
      } catch (error) {
        console.error('Error cargando baldosas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBaldosas();
  }, []);

  if (loading) return null;

  // Calcular cuántos fillers necesitamos
  const itemCount = gridItems.length;
  const fillers = Array.from({ length: Math.max(0, 8 - itemCount) });

  return (
    <div
      style={{
        opacity: 0,
        animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 4.4s forwards',
        marginTop: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        borderTop: '1px solid rgba(37, 99, 235, 0.1)',
      }}
    >
      <style>{`
        .grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-auto-rows: 180px;
          grid-auto-flow: dense;
          gap: 8px;
          width: 100%;
          max-width: 100%;
        }
        
        @media (min-width: 600px) {
          .grid-container {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
        }
        
        @media (min-width: 900px) {
          .grid-container {
            grid-template-columns: repeat(4, 1fr);
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
        
        .grid-item.tall {
          grid-row: span 2;
        }
        
        .grid-item.wide {
          grid-column: span 2;
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
          background-size: cover;
          background-position: center;
        }
        
        .grid-image.from-left {
          animation: slideInFromLeft 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        
        .grid-image.from-right {
          animation: slideInFromRight 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards;
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
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .grid-sublabel {
          color: rgba(240, 244, 248, 0.7);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.02em;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .grid-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(26, 42, 58, 0.9);
          color: var(--color-parchment);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          z-index: 3;
          backdrop-filter: blur(4px);
        }
        
        .grid-item-filler {
          border-radius: 12px;
          border: 1px solid rgba(37, 99, 235, 0.1);
          box-shadow: 0 2px 8px rgba(26, 42, 58, 0.04);
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
          <GridItemComponent key={item.id} item={item} />
        ))}
        {fillers.map((_, idx) => (
          <LogoFiller key={`filler-${idx}`} />
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
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '900px', width: '100%' }}>
          
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

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 4.25s forwards',
            marginBottom: 'var(--space-sm)',
          }}>
            <ContadorBaldosas />
          </div>

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
