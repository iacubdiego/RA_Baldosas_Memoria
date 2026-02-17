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
  const [fotoModal, setFotoModal] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBaldosas: 0,
    ubicacionesVisitadas: 0,
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
        const ubicacionesUnicas = new Set(
          data.recorridos.map((item: RecorridoItem) => item.ubicacion)
        );
        setStats({
          totalBaldosas: data.recorridos.length,
          ubicacionesVisitadas: ubicacionesUnicas.size,
        });
      }
    } catch (error) {
      console.error('Error cargando recorrido:', error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta baldosa de tu recorrido?')) return;
    setEliminandoId(itemId);
    try {
      const response = await fetch(`/api/recorridos/${itemId}`, { method: 'DELETE' });
      if (response.ok) {
        setItems(prev => prev.filter(i => i.id !== itemId));
        setStats(prev => ({
          ...prev,
          totalBaldosas: prev.totalBaldosas - 1,
        }));
      }
    } catch (error) {
      console.error('Error eliminando:', error);
    } finally {
      setEliminandoId(null);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ─── Loading / Auth states ────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-parchment)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ width: '48px', height: '48px', margin: '0 auto var(--space-md)' }} />
          <p style={{ color: 'var(--color-dust)' }}>Cargando tu recorrido...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-parchment)',
        padding: 'var(--space-md)',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          maxWidth: '480px',
          width: '100%',
          boxShadow: 'var(--shadow-medium)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🔒</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            marginBottom: 'var(--space-sm)',
            color: 'var(--color-stone)',
          }}>
            Iniciá sesión para ver tu recorrido
          </h2>
          <p style={{
            color: 'var(--color-dust)',
            marginBottom: 'var(--space-lg)',
          }}>
            Guardá las baldosas que encontrás y construí tu propio memorial.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="btn hover-lift"
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              padding: 'var(--space-md) var(--space-lg)',
              fontSize: '1rem',
              textTransform: 'none',
              letterSpacing: 'normal',
            }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-parchment)',
      paddingBottom: 'var(--space-xl)',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--color-stone)',
        color: 'white',
        padding: 'var(--space-xl) var(--space-md) var(--space-lg)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                color: 'var(--color-parchment)',
                marginBottom: 'var(--space-xs)',
              }}>
                Mi Recorrido
              </h1>
              <p style={{ color: 'var(--color-dust)', fontSize: '1rem' }}>
                Bienvenida/o, {user.nombre || user.email}
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: 'var(--space-sm) var(--space-md)',
                textAlign: 'center',
                minWidth: '90px',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-parchment)' }}>
                  {stats.totalBaldosas}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-dust)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Baldosas
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: 'var(--space-sm) var(--space-md)',
                textAlign: 'center',
                minWidth: '90px',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-parchment)' }}>
                  {stats.ubicacionesVisitadas}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-dust)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Lugares
                </div>
              </div>
            </div>
          </div>

          {/* Acciones del header */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/scanner')}
              className="btn"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                fontSize: '0.9rem',
                textTransform: 'none',
                letterSpacing: 'normal',
              }}
            >
              + Escanear baldosa
            </button>
            <button
              onClick={logout}
              className="btn"
              style={{
                background: 'transparent',
                color: 'var(--color-dust)',
                borderColor: 'rgba(255,255,255,0.2)',
                fontSize: '0.9rem',
                textTransform: 'none',
                letterSpacing: 'normal',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ marginTop: 'var(--space-xl)' }}>
        {items.length === 0 ? (
          /* Empty state */
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 'var(--space-xl)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-medium)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📍</div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              marginBottom: 'var(--space-sm)',
              color: 'var(--color-stone)',
            }}>
              Aún no encontraste ninguna baldosa
            </h2>
            <p style={{
              color: 'var(--color-dust)',
              fontSize: '1.1rem',
              marginBottom: 'var(--space-lg)',
              maxWidth: '600px',
              margin: '0 auto var(--space-lg)',
            }}>
              Usá el escáner para descubrir las baldosas de la memoria en Buenos Aires
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
                letterSpacing: 'normal',
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
            gap: 'var(--space-lg)',
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
                  transition: 'all var(--transition-base)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={() => router.push(`/baldosas/${item.baldosaId}`)}
              >
                {/* Foto */}
                <div style={{
                  height: '220px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'var(--color-parchment)',
                  flexShrink: 0,
                }}>
                  {item.fotoBase64 ? (
                    <img
                      src={item.fotoBase64}
                      alt={item.nombreVictima}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      color: 'var(--color-dust)',
                    }}>
                      📷
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    marginBottom: 'var(--space-xs)',
                    color: 'var(--color-stone)',
                    lineHeight: 1.3,
                  }}>
                    {item.nombreVictima}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    color: 'var(--color-dust)',
                    fontSize: '0.85rem',
                    marginBottom: 'var(--space-xs)',
                  }}>
                    <span>📍</span>
                    <span>{item.ubicacion}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    color: 'var(--color-dust)',
                    fontSize: '0.85rem',
                    marginBottom: 'var(--space-sm)',
                  }}>
                    <span>📅</span>
                    <span>{formatFecha(item.fechaEscaneo)}</span>
                  </div>

                  {item.notas && (
                    <p style={{
                      marginBottom: 'var(--space-sm)',
                      color: 'var(--color-concrete)',
                      fontSize: '0.85rem',
                      fontStyle: 'italic',
                    }}>
                      {item.notas}
                    </p>
                  )}

                  {/* Acciones */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: 'var(--space-sm)',
                    borderTop: '1px solid var(--color-parchment)',
                    display: 'flex',
                    gap: 'var(--space-sm)',
                  }}>
                    {/* Botón Ampliar foto */}
                    {item.fotoBase64 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setFotoModal(item.fotoBase64); }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: '#f0f4ff',
                          color: 'var(--color-primary)',
                          border: '1.5px solid #c7d7ff',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s',
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dce8ff';
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f0f4ff';
                          e.currentTarget.style.borderColor = '#c7d7ff';
                        }}
                        title="Ampliar foto"
                      >
                        <span style={{ fontSize: '1.4rem' }}>🔍</span>
                        <span>Ver foto</span>
                      </button>
                    )}

                    {/* Botón Eliminar */}
                    <button
                      onClick={(e) => eliminarItem(e, item.id)}
                      disabled={eliminandoId === item.id}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#fff5f5',
                        color: '#dc2626',
                        border: '1.5px solid #fecaca',
                        borderRadius: '10px',
                        cursor: eliminandoId === item.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: eliminandoId === item.id ? 0.5 : 1,
                        transition: 'all 0.2s',
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => {
                        if (eliminandoId !== item.id) {
                          e.currentTarget.style.background = '#ffe4e4';
                          e.currentTarget.style.borderColor = '#dc2626';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff5f5';
                        e.currentTarget.style.borderColor = '#fecaca';
                      }}
                      title="Eliminar del recorrido"
                    >
                      <span style={{ fontSize: '1.4rem' }}>🗑️</span>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal foto fullscreen */}
      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
          }}
        >
          <button
            onClick={() => setFotoModal(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <img
            src={fotoModal}
            alt="Foto ampliada"
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
