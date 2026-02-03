'use client'

import { useState, useRef } from 'react'

interface Propuesta {
  id: string
  nombrePersona: string
  descripcion: string
  lat: number
  lng: number
  direccion?: string
}

interface ConvertirModalProps {
  propuesta: Propuesta
  onClose: () => void
  onSuccess: () => void
}

export default function ConvertirModal({ propuesta, onClose, onSuccess }: ConvertirModalProps) {
  const [formData, setFormData] = useState({
    codigo: '',
    categoria: 'historico',
    barrio: '',
    mensajeAR: '',
    infoExtendida: propuesta.descripcion,
  })
  
  const [mindFile, setMindFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMindFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.mind')) {
      setError('El archivo debe tener extensión .mind')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máx 10MB)')
      return
    }

    setMindFile(file)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!formData.codigo || formData.codigo.trim().length < 4) {
      setError('El código debe tener al menos 4 caracteres')
      return
    }

    if (!formData.mensajeAR || formData.mensajeAR.trim().length < 5) {
      setError('El mensaje AR debe tener al menos 5 caracteres')
      return
    }

    if (!mindFile) {
      setError('Debes subir el archivo .mind compilado')
      return
    }

    setLoading(true)

    try {
      // Crear FormData con todos los campos
      const data = new FormData()
      data.append('codigo', formData.codigo.trim())
      data.append('categoria', formData.categoria)
      data.append('barrio', formData.barrio.trim())
      data.append('mensajeAR', formData.mensajeAR.trim())
      data.append('infoExtendida', formData.infoExtendida.trim() || propuesta.descripcion)
      data.append('mindFile', mindFile)

      // Enviar al API
      const response = await fetch(`/api/propuestas/${propuesta.id}/convertir`, {
        method: 'POST',
        body: data, // FormData se envía sin Content-Type header
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al convertir propuesta')
      }

      // Éxito
      onSuccess()
      onClose()

    } catch (err: any) {
      setError(err.message || 'Error al convertir propuesta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 10000,
      overflow: 'auto',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1,
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#1a2a3a', marginBottom: '4px' }}>
              Convertir a Baldosa
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
              {propuesta.nombrePersona}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Mensaje de error */}
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#dc2626',
              marginBottom: '20px',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          {/* Código */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Código único <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleInputChange}
              placeholder="Ej: BALD-015"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95rem',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              Debe ser único en el sistema
            </p>
          </div>

          {/* Categoría */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Categoría <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95rem',
              }}
            >
              <option value="historico">Histórico</option>
              <option value="artista">Artista</option>
              <option value="politico">Político</option>
              <option value="deportista">Deportista</option>
              <option value="cultural">Cultural</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Barrio */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Barrio (opcional)
            </label>
            <input
              type="text"
              name="barrio"
              value={formData.barrio}
              onChange={handleInputChange}
              placeholder="Ej: Balvanera"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95rem',
              }}
            />
          </div>

          {/* Mensaje AR */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Mensaje AR <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              name="mensajeAR"
              value={formData.mensajeAR}
              onChange={handleInputChange}
              placeholder="Ej: Desaparecido 1977 - Nunca Más"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95rem',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              Texto que aparece en la experiencia AR
            </p>
          </div>

          {/* Info extendida */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Información extendida (opcional)
            </label>
            <textarea
              name="infoExtendida"
              value={formData.infoExtendida}
              onChange={handleInputChange}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Archivo .mind */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 500,
              color: '#374151',
              fontSize: '0.9rem',
            }}>
              Archivo .mind <span style={{ color: '#dc2626' }}>*</span>
            </label>

            {/* Instrucciones */}
            <div style={{
              padding: '16px',
              background: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '0.85rem', color: '#0c4a6e', marginBottom: '8px', fontWeight: 500 }}>
                📝 Compilar archivo .mind primero:
              </p>
              <ol style={{ marginLeft: '20px', fontSize: '0.85rem', color: '#0c4a6e' }}>
                <li>Ir a: <a href="https://hiukim.github.io/mind-ar-js-doc/tools/compile" target="_blank" style={{ color: '#0ea5e9' }}>compilador online ↗</a></li>
                <li>Subir la imagen de la baldosa</li>
                <li>Click "Start" y esperar</li>
                <li>Descargar targets.mind</li>
                <li>Subir el archivo aquí</li>
              </ol>
            </div>

            {/* Upload área */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed ' + (mindFile ? '#22c55e' : '#d1d5db'),
                borderRadius: '8px',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: mindFile ? '#f0fdf4' : '#f9fafb',
                transition: 'all 0.2s',
              }}
            >
              {mindFile ? (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✅</div>
                  <p style={{ fontSize: '1rem', fontWeight: 500, color: '#16a34a', marginBottom: '4px' }}>
                    {mindFile.name}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {(mindFile.size / 1024).toFixed(0)} KB
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#0ea5e9', marginTop: '12px' }}>
                    Click para cambiar archivo
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📁</div>
                  <p style={{ fontSize: '1rem', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                    Click para subir archivo .mind
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    Archivo compilado con el compilador online
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".mind"
              onChange={handleMindFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Botones */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !mindFile}
              style={{
                padding: '10px 20px',
                background: (loading || !mindFile) ? '#9ca3af' : '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (loading || !mindFile) ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                  Creando...
                </>
              ) : (
                '✓ Crear Baldosa'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
