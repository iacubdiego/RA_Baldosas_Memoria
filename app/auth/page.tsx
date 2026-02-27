'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TabType = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    edad: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      setSuccess('¡Bienvenido!');
      setTimeout(() => {
        router.push('/coleccion');
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones
    if (registerData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const edad = parseInt(registerData.edad);
    if (isNaN(edad) || edad < 1 || edad > 120) {
      setError('Edad inválida');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...registerData,
          edad: parseInt(registerData.edad)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      setSuccess('¡Cuenta creada! Redirigiendo...');
      setTimeout(() => {
        router.push('/coleccion');
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-background">
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
      }}>
        <div className="animate-fade-in-up" style={{
          width: '100%',
          maxWidth: '480px',
        }}>
          
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: 'var(--space-lg)',
          }}>
            <div className="panuelo-container" style={{
              marginBottom: 'var(--space-md)',
            }}>
              <img 
                src="images/logo_flores.png"
                alt="Pañuelo" 
                className="panuelo-icon"
                style={{ width: '80px', height: '80px' }}
              />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--color-stone)',
              marginBottom: 'var(--space-xs)',
            }}>
              Mi Recorrido
            </h1>
            <p style={{
              color: 'var(--color-dust)',
              fontSize: '1rem',
            }}>
              Inicia sesión para guardar tus baldosas encontradas
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-xs)',
            marginBottom: 'var(--space-md)',
            background: 'white',
            borderRadius: '8px',
            padding: '4px',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <button
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccess(null);
              }}
              style={{
                flex: 1,
                padding: 'var(--space-sm)',
                background: activeTab === 'login' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'login' ? 'white' : 'var(--color-stone)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textTransform: 'none',
                letterSpacing: 'normal',
              }}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setError(null);
                setSuccess(null);
              }}
              style={{
                flex: 1,
                padding: 'var(--space-sm)',
                background: activeTab === 'register' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'register' ? 'white' : 'var(--color-stone)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textTransform: 'none',
                letterSpacing: 'normal',
              }}
            >
              Crear Cuenta
            </button>
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

          {/* Forms */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: 'var(--space-lg)',
            boxShadow: 'var(--shadow-medium)',
          }}>
            
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-xs)',
                    fontWeight: 500,
                    color: 'var(--color-stone)',
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
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

                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-xs)',
                    fontWeight: 500,
                    color: 'var(--color-stone)',
                  }}>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="hover-lift"
                  style={{
                    width: '100%',
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
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
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
                    value={registerData.nombre}
                    onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
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
                    value={registerData.apellido}
                    onChange={(e) => setRegisterData({ ...registerData, apellido: e.target.value })}
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
                    Edad
                  </label>
                  <input
                    type="number"
                    value={registerData.edad}
                    onChange={(e) => setRegisterData({ ...registerData, edad: e.target.value })}
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

                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-xs)',
                    fontWeight: 500,
                    color: 'var(--color-stone)',
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
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

                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-xs)',
                    fontWeight: 500,
                    color: 'var(--color-stone)',
                  }}>
                    Contraseña
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
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
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
                  type="submit"
                  disabled={loading}
                  className="hover-lift"
                  style={{
                    width: '100%',
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
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>
              </form>
            )}
          </div>

          {/* Footer link */}
          <div style={{
            textAlign: 'center',
            marginTop: 'var(--space-md)',
            color: 'var(--color-dust)',
            fontSize: '0.9rem',
          }}>
            <a 
              href="/"
              style={{
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
