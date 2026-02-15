'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerColeccion, obtenerEstadisticas, ItemColeccion } from '@/lib/coleccion';

export default function RecorridoPage() {
  const router = useRouter();
  const [items, setItems] = useState<ItemColeccion[]>([]);
  const [stats, setStats] = useState({
    totalBaldosas: 0,
    ubicacionesVisitadas: 0,
    primeraVisita: null as string | null,
    ultimaVisita: null as string | null
  });

  useEffect(() => {
    cargarRecorrido();
  }, []);

  const cargarRecorrido = () => {
    const coleccion = obtenerColeccion();
    const estadisticas = obtenerEstadisticas();
    setItems(coleccion.items);
    setStats(estadisticas);
  };

  const formatearFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (items.length === 0) {
    return (
      <div className="hero-background">
        <div className="container" style={{
          paddingTop: 'var(--space-xl)',
          paddingBottom: 'var(--space-xl)',
          textAlign: 'center'
        }}>
          <div className="panuelo-container">
            <img 
              src="/panuelo-bg-sin-fondo.png" 
              alt="Pañuelo"
              className="panuelo-icon"
            />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: 'var(--color-stone)',
            marginBottom: 'var(--space-md)',
            lineHeight: 1.2
          }}>
            Mi Recorrido
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--color-dust)',
            marginBottom: 'var(--space-xl)',
            maxWidth: '600px',
            margin: '0 auto var(--space-xl) auto'
          }}>
            Aún no has escaneado ninguna baldosa.
            <br />
            Comienza tu recorrido memorial.
          </p>

          <a
            href="/scanner"
            className="button"
            style={{
              display: 'inline-block',
              padding: 'var(--space-md) var(--space-lg)',
              background: 'var(--color-primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.1rem',
              transition: 'all var(--transition-base)',
              boxShadow: 'var(--shadow-medium)'
            }}
          >
            Escanear mi primera baldosa
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-background">
      <div className="container" style={{
        paddingTop: 'var(--space-lg)',
        paddingBottom: 'var(--space-xl)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: 'var(--color-stone)',
            marginBottom: 'var(--space-sm)'
          }}>
            Mi Recorrido
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--color-dust)'
          }}>
            {items.length} {items.length === 1 ? 'baldosa encontrada' : 'baldosas encontradas'}
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)'
        }}>
          <div style={{
            background: 'white',
            padding: 'var(--space-md)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-soft)',
            border: '2px solid var(--color-primary)'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 'var(--space-xs)'
            }}>
              {stats.totalBaldosas}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--color-dust)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Baldosas
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: 'var(--space-md)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-soft)',
            border: '2px solid var(--color-primary)'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: 'var(--space-xs)'
            }}>
              {stats.ubicacionesVisitadas}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--color-dust)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Ubicaciones
            </div>
          </div>
        </div>

        {/* Grid de baldosas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-lg)'
        }}>
          {items.map((item, index) => (
            <a
              key={item.id}
              href={`/coleccion/${item.id}`}
              className="animate-fade-in hover-lift"
              style={{
                display: 'block',
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-soft)',
                border: '2px solid var(--color-primary)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all var(--transition-base)',
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Imagen */}
              <div style={{
                width: '100%',
                aspectRatio: '4/3',
                overflow: 'hidden',
                background: 'var(--color-concrete)'
              }}>
                <img
                  src={item.fotoUrl}
                  alt={item.nombreVictima}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform var(--transition-base)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onError={(e) => {
                    console.error('Error cargando imagen:', item.fotoUrl?.substring(0, 50));
                    e.currentTarget.src = '/panuelo-bg-sin-fondo.png';
                  }}
                  onLoad={() => {
                    console.log('✅ Imagen cargada correctamente');
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ padding: 'var(--space-md)' }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-stone)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  {item.nombreVictima}
                </h3>

                {item.fechaDesaparicion && (
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-dust)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    {item.fechaDesaparicion}
                  </p>
                )}

                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-dust)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  📍 {item.ubicacion}
                </p>

                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-concrete)',
                  fontStyle: 'italic'
                }}>
                  Escaneada: {formatearFecha(item.fechaEscaneo)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
