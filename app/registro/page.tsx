'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegistroPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Registro exitoso - redirigir a home
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Error al registrar usuario')
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-background">
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: 'var(--space-lg)',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: 'var(--space-xl)',
          maxWidth: '450px',
          width: '100%',
          boxShadow: 'var(--shadow-strong)',
        }}>
          
          {/* Logo/Título */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
            <img 
              src="/panuelo-bg-sin-fondo.png" 
              alt="Logo" 
              style={{ width: '60px', height: '60px', margin: '0 auto var(--space-sm)' }}
            />
            <h1 style={{ 
              fontSize: '1.8rem', 
              marginBottom: 'var(--space-xs)',
              color: 'var(--color-stone)',
            }}>
              Crear Cuenta
            </h1>
            <p style={{ color: 'var(--color-dust)', fontSize: '0.95rem' }}>
              Comenzá tu colección de memoria
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: 'var(--space-sm) var(--space-md)',
              background: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#dc2626',
              marginBottom: 'var(--space-md)',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-xs)',
                fontWeight: 500,
                color: 'var(--color-stone)',
              }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
                placeholder="Juan Pérez"
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
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
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
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
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
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                placeholder="••••••••"
                minLength={6}
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
              <p style={{ fontSize: '0.8rem', color: 'var(--color-dust)', marginTop: '4px' }}>
                Mínimo 6 caracteres
              </p>
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-xs)',
                fontWeight: 500,
                color: 'var(--color-stone)',
              }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                placeholder="••••••••"
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

            <button
              type="submit"
              disabled={loading}
              className="btn hover-lift hover-glow"
              style={{
                width: '100%',
                background: loading ? 'var(--color-dust)' : 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: 'var(--space-md)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: 'var(--space-md)',
              }}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Link a login */}
          <div style={{ 
            textAlign: 'center',
            paddingTop: 'var(--space-md)',
            borderTop: '1px solid #e5e7eb',
          }}>
            <p style={{ color: 'var(--color-dust)', fontSize: '0.9rem' }}>
              ¿Ya tenés cuenta?{' '}
              <Link 
                href="/login"
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Iniciá sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
