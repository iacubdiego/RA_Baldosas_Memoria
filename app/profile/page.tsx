'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    edad: '',
    passwordActual: '',
    passwordNueva: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        edad: user.edad.toString(),
        passwordActual: '',
        passwordNueva: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validaciones
    if (showPasswordFields) {
      if (!formData.passwordActual) {
        setError('Ingresa tu contraseña actual');
        setLoading(false);
        return;
      }
      if (!formData.passwordNueva) {
        setError('Ingresa tu nueva contraseña');
        setLoading(false);
        return;
      }
      if (formData.passwordNueva.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          edad: parseInt(formData.edad),
          ...(showPasswordFields && {
            passwordActual: formData.passwordActual,
            passwordNueva: formData.passwordNueva
          })
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar perfil');
      }

      setSuccess('Perfil actualizado exitosamente');
      
      // Limpiar campos de contraseña
      if (showPasswordFields) {
        setFormData(prev => ({
          ...prev,
          passwordActual: '',
          passwordNueva: ''
        }));
        setShowPasswordFields(false);
      }

      // Recargar página después de 1.5s
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
    <div className="hero-background">
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: 'calc(100vh - 200px)',
        padding: 'var(--space-lg) var(--space-md)',
      }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{
            marginBottom: 'var(--space-xl)',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--color-stone)',
              marginBottom: 'var(--space-xs)',
            }}>
              Mi Perfil
            </h1>
            <p style={{
              color: 'var(--color-dust)',
              fontSize: '1rem',
            }}>
              {user?.email}
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div style={{
              padding: 'var(--space-sm) var(--space-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: 'var(--space-md)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: 'var(--space-sm) var(--space-md)',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#16a34a',
              borderRadius: '8px',
              marginBottom: 'var(--space-md)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}>
              {success}
            </div>
          )}

          {/* Form */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: 'var(--space-lg)',
            boxShadow: 'var(--shadow-medium)',
          }}>
            <form onSubmit={handleSubmit}>
              
              {/* Datos Personales */}
              <div style={{
                marginBottom: 'var(--space-lg)',
                paddingBottom: 'var(--space-lg)',
                borderBottom: '1px solid var(--color-parchment)'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  marginBottom: 'var(--space-md)',
                  color: 'var(--color-stone)'
                }}>
                  Datos Personales
                </h3>

                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-xs)',
                    fontWeight: 500,
                    color: 'var(--color-stone)',
                  }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--space-sm)',
                      border: '2px solid var(--color-dust)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-dust)'}
                  />
                </div>

                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-xs)',
                    fontWeight: 500,
                    color: 'var(--color-stone)',
                  }}>
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--space-sm)',
                      border: '2px solid var(--color-dust)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-dust)'}
                  />
                </div>

                <div style={{ marginBottom: 0 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-xs)',
                    fontWeight: 500,
                    color: 'var(--color-stone)',
                  }}>
                    Edad
                  </label>
                  <input
                    type="number"
                    value={formData.edad}
                    onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                    required
                    min="1"
                    max="120"
                    style={{
                      width: '100%',
                      padding: 'var(--space-sm)',
                      border: '2px solid var(--color-dust)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-dust)'}
                  />
                </div>
              </div>

              {/* Cambiar Contraseña */}
              <div style={{
                marginBottom: 'var(--space-lg)'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  marginBottom: 'var(--space-sm)',
                  color: 'var(--color-stone)'
                }}>
                  Cambiar Contraseña
                </h3>

                {!showPasswordFields ? (
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(true)}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      background: 'transparent',
                      border: '2px solid var(--color-primary)',
                      color: 'var(--color-primary)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      transition: 'all var(--transition-fast)',
                      textTransform: 'none',
                      letterSpacing: 'normal'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'var(--color-primary)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                  >
                    Cambiar Contraseña
                  </button>
                ) : (
                  <>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: 'var(--space-xs)',
                        fontWeight: 500,
                        color: 'var(--color-stone)',
                      }}>
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        value={formData.passwordActual}
                        onChange={(e) => setFormData({ ...formData, passwordActual: e.target.value })}
                        style={{
                          width: '100%',
                          padding: 'var(--space-sm)',
                          border: '2px solid var(--color-dust)',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-body)',
                          transition: 'border-color var(--transition-fast)',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-dust)'}
                      />
                    </div>

                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: 'var(--space-xs)',
                        fontWeight: 500,
                        color: 'var(--color-stone)',
                      }}>
                        Nueva Contraseña
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 400,
                          color: 'var(--color-dust)',
                          marginLeft: 'var(--space-xs)',
                        }}>
                          (mínimo 6 caracteres)
                        </span>
                      </label>
                      <input
                        type="password"
                        value={formData.passwordNueva}
                        onChange={(e) => setFormData({ ...formData, passwordNueva: e.target.value })}
                        minLength={6}
                        style={{
                          width: '100%',
                          padding: 'var(--space-sm)',
                          border: '2px solid var(--color-dust)',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-body)',
                          transition: 'border-color var(--transition-fast)',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-dust)'}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordFields(false);
                        setFormData(prev => ({
                          ...prev,
                          passwordActual: '',
                          passwordNueva: ''
                        }));
                      }}
                      style={{
                        padding: 'var(--space-xs) var(--space-sm)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-dust)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        textDecoration: 'underline',
                        textTransform: 'none',
                        letterSpacing: 'normal'
                      }}
                    >
                      Cancelar cambio de contraseña
                    </button>
                  </>
                )}
              </div>

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                flexWrap: 'wrap'
              }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="hover-lift"
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: 'var(--space-md)',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-xs)',
                    textTransform: 'none',
                    letterSpacing: 'normal',
                  }}
                >
                  {loading && <span className="loading" style={{ width: '16px', height: '16px', borderTopColor: 'white' }} />}
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/coleccion')}
                  style={{
                    padding: 'var(--space-md)',
                    background: 'transparent',
                    border: '2px solid var(--color-stone)',
                    color: 'var(--color-stone)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textTransform: 'none',
                    letterSpacing: 'normal'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-stone)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-stone)';
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
