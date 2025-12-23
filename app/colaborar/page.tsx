'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

export default function ColaborarPage() {
  const [formData, setFormData] = useState({
    nombrePersona: '',
    descripcion: '',
    direccion: '',
    emailContacto: '',
  })
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null)
  const [imagen, setImagen] = useState<string | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingUbicacion, setLoadingUbicacion] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)
  const [enviado, setEnviado] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const capturarUbicacion = () => {
    if (!navigator.geolocation) {
      setMensaje({ tipo: 'error', texto: 'Tu navegador no soporta geolocalización' })
      return
    }

    setLoadingUbicacion(true)
    setMensaje(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacion({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLoadingUbicacion(false)
        setMensaje({ tipo: 'exito', texto: '✓ Ubicación capturada correctamente' })
        setTimeout(() => setMensaje(null), 3000)
      },
      (error) => {
        setLoadingUbicacion(false)
        let errorMsg = 'Error al obtener ubicación'
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permiso de ubicación denegado. Habilítalo en tu navegador.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Ubicación no disponible'
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Tiempo de espera agotado'
        }
        setMensaje({ tipo: 'error', texto: errorMsg })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'Solo se permiten imágenes' })
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'La imagen debe ser menor a 5MB' })
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setImagen(base64)
      setImagenPreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const eliminarImagen = () => {
    setImagen(null)
    setImagenPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje(null)

    // Validaciones
    if (!formData.nombrePersona.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre de la persona homenajeada es requerido' })
      return
    }

    if (!formData.descripcion.trim() || formData.descripcion.length < 10) {
      setMensaje({ tipo: 'error', texto: 'La descripción debe tener al menos 10 caracteres' })
      return
    }

    if (!ubicacion) {
      setMensaje({ tipo: 'error', texto: 'Debes capturar la ubicación de la baldosa' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/propuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombrePersona: formData.nombrePersona,
          descripcion: formData.descripcion,
          lat: ubicacion.lat,
          lng: ubicacion.lng,
          direccion: formData.direccion,
          imagenBase64: imagen,
          emailContacto: formData.emailContacto,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEnviado(true)
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al enviar la propuesta' })
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Intenta nuevamente.' })
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de éxito
  if (enviado) {
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
          <div className="container animate-fade-in-scale" style={{ 
            textAlign: 'center', 
            maxWidth: '600px',
            background: 'white',
            padding: 'var(--space-xl)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-strong)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-lg)',
              fontSize: '2.5rem',
            }}>
              ✓
            </div>
            <h1 style={{ 
              fontSize: '2rem', 
              marginBottom: 'var(--space-md)',
              color: 'var(--color-stone)',
            }}>
              ¡Gracias por colaborar!
            </h1>
            <p style={{ 
              color: 'var(--color-concrete)',
              marginBottom: 'var(--space-lg)',
              fontSize: '1.1rem',
            }}>
              Tu propuesta fue enviada correctamente y será revisada por nuestro equipo.
              Juntos mantenemos viva la memoria.
            </p>
            <div className="cluster" style={{ justifyContent: 'center' }}>
              <Link href="/" className="btn hover-lift" style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
              }}>
                Volver al inicio
              </Link>
              <button 
                onClick={() => {
                  setEnviado(false)
                  setFormData({ nombrePersona: '', descripcion: '', direccion: '', emailContacto: '' })
                  setUbicacion(null)
                  setImagen(null)
                  setImagenPreview(null)
                }}
                className="btn hover-lift"
              >
                Enviar otra propuesta
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hero-background">
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: 'var(--space-lg)',
      }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          
          {/* Header */}
          <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
            <h1 style={{
              background: 'linear-gradient(135deg, var(--color-stone) 0%, var(--color-primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 'var(--space-sm)',
            }}>
              Colaborar
            </h1>
            <p style={{ color: 'var(--color-concrete)', fontSize: '1.1rem' }}>
              ¿Conocés una baldosa de la memoria? Ayudanos a documentarla enviando su ubicación e imagen.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="animate-fade-in-up delay-200">
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: 'var(--space-lg)',
              boxShadow: 'var(--shadow-medium)',
            }}>
              
              {/* Mensaje de estado */}
              {mensaje && (
                <div style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: '8px',
                  marginBottom: 'var(--space-md)',
                  background: mensaje.tipo === 'exito' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: mensaje.tipo === 'exito' ? '#16a34a' : '#dc2626',
                  border: `1px solid ${mensaje.tipo === 'exito' ? '#22c55e' : '#ef4444'}`,
                }}>
                  {mensaje.texto}
                </div>
              )}

              {/* Nombre de la persona */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-xs)',
                  fontWeight: 500,
                  color: 'var(--color-stone)',
                }}>
                  Nombre de la persona homenajeada *
                </label>
                <input
                  type="text"
                  name="nombrePersona"
                  value={formData.nombrePersona}
                  onChange={handleInputChange}
                  placeholder="Ej: María Elena Walsh"
                  required
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm)',
                    border: '2px solid var(--color-dust)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color var(--transition-fast)',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-dust)'}
                />
              </div>

              {/* Descripción */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-xs)',
                  fontWeight: 500,
                  color: 'var(--color-stone)',
                }}>
                  Descripción o historia *
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Contanos brevemente quién fue esta persona y por qué es importante recordarla..."
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm)',
                    border: '2px solid var(--color-dust)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-dust)'}
                />
              </div>

              {/* Ubicación */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-xs)',
                  fontWeight: 500,
                  color: 'var(--color-stone)',
                }}>
                  Ubicación de la baldosa *
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={capturarUbicacion}
                    disabled={loadingUbicacion}
                    className="btn"
                    style={{
                      background: ubicacion ? 'var(--color-primary)' : 'transparent',
                      color: ubicacion ? 'white' : 'var(--color-stone)',
                      borderColor: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {loadingUbicacion ? (
                      <>
                        <span className="loading" style={{ width: '16px', height: '16px' }} />
                        Obteniendo...
                      </>
                    ) : (
                      <>
                        📍 {ubicacion ? 'Ubicación capturada' : 'Capturar mi ubicación'}
                      </>
                    )}
                  </button>
                  {ubicacion && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-dust)' }}>
                      ({ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)})
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-dust)', marginTop: 'var(--space-xs)' }}>
                  Asegurate de estar cerca de la baldosa para una ubicación precisa
                </p>
              </div>

              {/* Dirección (opcional) */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-xs)',
                  fontWeight: 500,
                  color: 'var(--color-stone)',
                }}>
                  Dirección (opcional)
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm)',
                    border: '2px solid var(--color-dust)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-dust)'}
                />
              </div>

              {/* Imagen */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-xs)',
                  fontWeight: 500,
                  color: 'var(--color-stone)',
                }}>
                  Foto de la baldosa (opcional)
                </label>
                
                {!imagenPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--color-dust)',
                      borderRadius: '8px',
                      padding: 'var(--space-lg)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)'
                      e.currentTarget.style.background = 'rgba(37, 99, 235, 0.02)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-dust)'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>📷</div>
                    <p style={{ color: 'var(--color-concrete)', marginBottom: 'var(--space-xs)' }}>
                      Tocá para subir una imagen
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-dust)' }}>
                      JPG, PNG o WEBP. Máximo 5MB.
                    </p>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={imagenPreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={eliminarImagen}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Email (opcional) */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-xs)',
                  fontWeight: 500,
                  color: 'var(--color-stone)',
                }}>
                  Email de contacto (opcional)
                </label>
                <input
                  type="email"
                  name="emailContacto"
                  value={formData.emailContacto}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm)',
                    border: '2px solid var(--color-dust)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-dust)'}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--color-dust)', marginTop: 'var(--space-xs)' }}>
                  Te contactaremos si necesitamos más información
                </p>
              </div>

              {/* Botón enviar */}
              <button
                type="submit"
                disabled={loading}
                className="btn hover-lift hover-glow"
                style={{
                  width: '100%',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--space-md)',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? (
                  <>
                    <span className="loading" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} />
                    Enviando...
                  </>
                ) : (
                  'Enviar propuesta'
                )}
              </button>
            </div>
          </form>

          {/* Info adicional */}
          <div className="animate-fade-in delay-400" style={{
            marginTop: 'var(--space-lg)',
            textAlign: 'center',
            color: 'var(--color-dust)',
            fontSize: '0.9rem',
          }}>
            <p>
              Todas las propuestas son revisadas antes de publicarse.
              <br />
              Este proyecto es colaborativo y sin fines de lucro.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
