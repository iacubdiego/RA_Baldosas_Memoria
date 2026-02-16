'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface RecorridoItem {
  id: string;
  baldosaId: string;
  nombreVictima: string;
  fechaDesaparicion: string;
  fechaEscaneo: string;
  fotoBase64: string;
  ubicacion: string;
  lat: number;
  lng: number;
  notas: string;
}

export default function RecorridoPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [items, setItems] = useState<RecorridoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBaldosas: 0,
    ubicacionesVisitadas: 0
  });

  useEffect(() => {
    if (!authLoading && user) {
      cargarRecorrido();
    }
  }, [authLoading, user]);

  const cargarRecorrido = async () => {
    try {
      const response = await fetch('/api/recorridos');
      const data = await response.json();

      if (response.ok) {
        setItems(data.recorridos || []);
        
        // Calcular stats
        const ubicacionesUnicas = new Set(
          data.recorridos.map((item: RecorridoItem) => item.ubicacion)
        );
        
        setStats({
          totalBaldosas: data.recorridos.length,
          ubicacionesVisitadas: ubicacionesUnicas.size
        });
      }
    } catch (error) {
      console.error('Error cargando recorrido:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-parchment)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ width: '40px', height: '40px' }} />
          <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-dust)' }}>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-parchment)',
      paddingBottom: 'var(--space-xl)'
    }}>
      {/* Hero con stats */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-stone) 0%, var(--color-concrete) 100%)',
        padding: 'var(--space-xl) var(--space-md)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/panuelo-bg.jpeg)',
          backgroundSize: '150px 150px',
          opacity: 0.05,
          pointerEvents: 'none'
        }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* User info y logout */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-lg)',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)'
          }}>
            <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '4px' }}>
                Bienvenido/a
              </p>
              <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                {user?.nombre} {user?.apellido}
              </p>
            </div>
            <button
              onClick={logout}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9rem',
                transition: 'all var(--transition-fast)',
                textTransform: 'none',
                letterSpacing: 'normal'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
            >
              Cerrar Sesión
            </button>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            marginBottom: 'var(--space-md)'
          }}>
            Mi Recorrido
          </h1>
          
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-md)',
            marginTop: 'var(--space-lg)'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: 'var(--space-md)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '4px' }}>
                {stats.totalBaldosas}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Baldosas Encontradas
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: 'var(--space-md)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '4px' }}>
                {stats.ubicacionesVisitadas}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Ubicaciones Visitadas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ marginTop: 'calc(var(--space-xl) * -1)' }}>
        {items.length === 0 ? (
          /* Empty state */
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 'var(--space-xl)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-medium)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>
              📍
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              marginBottom: 'var(--space-sm)',
              color: 'var(--color-stone)'
            }}>
              Aún no has encontrado ninguna baldosa
            </h2>
            <p style={{
              color: 'var(--color-dust)',
              fontSize: '1.1rem',
              marginBottom: 'var(--space-lg)',
              maxWidth: '600px',
              margin: '0 auto var(--space-lg)'
            }}>
              Usa el escáner para descubrir las baldosas de la memoria en Buenos Aires
            </p>
            <button
              onClick={() => router.push('/scanner')}
              className="btn hover-lift"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: 'var(--space-md) var(--space-lg)',
                fontSize: '1rem',
                textTransform: 'none',
                letterSpacing: 'normal'
              }}
            >
              Comenzar a Escanear
            </button>
          </div>
        ) : (
          /* Grid de baldosas */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="hover-lift"
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-soft)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
                onClick={() => router.push(`/baldosas/${item.baldosaId}`)}
              >
                {/* Foto */}
                <div style={{
                  height: '220px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'var(--color-parchment)'
                }}>
                  {item.fotoBase64 ? (
                    <img
                      src={item.fotoBase64}
                      alt={item.nombreVictima}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      color: 'var(--color-dust)'
                    }}>
                      📷
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: 'var(--space-md)' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.3rem',
                    marginBottom: 'var(--space-xs)',
                    color: 'var(--color-stone)'
                  }}>
                    {item.nombreVictima}
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    color: 'var(--color-dust)',
                    fontSize: '0.9rem',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    <span>📍</span>
                    <span>{item.ubicacion}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    color: 'var(--color-dust)',
                    fontSize: '0.9rem'
                  }}>
                    <span>📅</span>
                    <span>{formatFecha(item.fechaEscaneo)}</span>
                  </div>

                  {item.notas && (
                    <p style={{
                      marginTop: 'var(--space-sm)',
                      color: 'var(--color-concrete)',
                      fontSize: '0.9rem',
                      fontStyle: 'italic'
                    }}>
                      {item.notas}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
