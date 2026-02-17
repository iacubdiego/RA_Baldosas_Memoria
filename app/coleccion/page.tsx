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
  
  // Estado para el modal de foto
  const [modalFoto, setModalFoto] = useState<{
    visible: boolean;
    foto: string;
    nombre: string;
  }>({
    visible: false,
    foto: '',
    nombre: ''
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

  // Abrir modal de foto
  const abrirModalFoto = (foto: string, nombre: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se active el onClick del card
    setModalFoto({
      visible: true,
      foto,
      nombre
    });
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalFoto({
      visible: false,
      foto: '',
      nombre: ''
    });
  };

  // Eliminar baldosa del recorrido
  const eliminarBaldosa = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se active el onClick del card
    
    if (!confirm('¿Estás seguro que querés eliminar esta baldosa de tu recorrido?')) {
      return;
    }

    try {
      const response = await fetch(`/api/recorridos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Recargar recorrido
        await cargarRecorrido();
        
        // Mostrar notificación
        alert('Baldosa eliminada. Ahora podés escanearla de nuevo.');
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error eliminando baldosa:', error);
      alert('Error al eliminar la baldosa');
    }
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
            Cargando tu recorrido...
          </p>
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
        background: 'var(--color-parchment)'
      }}>
        <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-md)' }}>
            Necesitás iniciar sesión
          </h2>
          <button
            onClick={() => router.push('/auth')}
            className="btn"
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none'
            }}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-parchment)' }}>
      {/* Header Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
        color: 'white',
        padding: 'var(--space-xl) 0',
        marginBottom: 'var(--space-xl)'
      }}>
        <div className="container">
          {/* Top Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-lg)'
          }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: '8px',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)'
              }}
            >
              ← Volver
            </button>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button
                onClick={() => router.push('/profile')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.95rem'
                }}
              >
                Mi Perfil
              </button>
              
              <button
                onClick={logout}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.95rem'
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3rem',
            marginBottom: 'var(--space-md)',
            fontWeight: 700
          }}>
            Mi Recorrido
          </h1>
          
          <p style={{
            fontSize: '1.2rem',
            opacity: 0.95,
            marginBottom: 'var(--space-lg)'
          }}>
            Hola, {user.nombre}. Este es tu recorrido personal por las baldosas de la memoria.
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-md)'
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
                  position: 'relative',
                  transition: 'all var(--transition-base)'
                }}
              >
                {/* Botón Eliminar - SUPERIOR DERECHA */}
                <button
                  onClick={(e) => eliminarBaldosa(item.id, e)}
                  style={{
                    position: 'absolute',
                    top: 'var(--space-sm)',
                    right: 'var(--space-sm)',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    fontSize: '1.2rem',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.9)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Eliminar de mi recorrido"
                >
                  🗑️
                </button>

                {/* Foto - CLICKEABLE */}
                <div 
                  style={{
                    height: '220px',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'var(--color-parchment)',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => item.fotoBase64 && abrirModalFoto(item.fotoBase64, item.nombreVictima, e)}
                >
                  {item.fotoBase64 ? (
                    <>
                      <img
                        src={item.fotoBase64}
                        alt={item.nombreVictima}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                      {/* Overlay "Ver" al hacer hover */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        opacity: 0,
                        transition: 'all 0.3s',
                        pointerEvents: 'none'
                      }}
                      className="foto-overlay"
                      >
                        🔍 Ver foto
                      </div>
                    </>
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

                {/* Info - CLICKEABLE para ir a detalle */}
                <div 
                  style={{ padding: 'var(--space-md)', cursor: 'pointer' }}
                  onClick={() => router.push(`/baldosas/${item.baldosaId}`)}
                >
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

      {/* MODAL PARA VER FOTO EN GRANDE */}
      {modalFoto.visible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-lg)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={cerrarModal}
        >
          <div
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
              animation: 'scaleIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={cerrarModal}
              style={{
                position: 'absolute',
                top: '-50px',
                right: '0',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ✕
            </button>

            {/* Título */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: '0',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 600
            }}>
              {modalFoto.nombre}
            </div>

            {/* Imagen */}
            <img
              src={modalFoto.foto}
              alt={modalFoto.nombre}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
            />
          </div>
        </div>
      )}

      {/* Estilos para animaciones y hover */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .hover-lift:hover .foto-overlay {
          opacity: 1 !important;
          background: rgba(0,0,0,0.5) !important;
        }
      `}</style>
    </div>
  );
}
