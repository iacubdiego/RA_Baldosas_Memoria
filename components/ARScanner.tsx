'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

declare global {
  interface Window {
    AFRAME: any
    MINDAR: any
  }
}

interface Baldosa {
  id: string
  nombre: string
  categoria: string
  mensajeAR: string
  descripcion?: string
  imagenUrl: string
  audioUrl?: string
  targetIndex: number
}

export default function ARScanner() {
  const [currentBaldosa, setCurrentBaldosa] = useState<Baldosa | null>(null)
  const [baldosas, setBaldosas] = useState<Baldosa[]>([])
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [loadingScripts, setLoadingScripts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scannerReady, setScannerReady] = useState(false)
  const sceneRef = useRef<HTMLElement | null>(null)
  const targetRefs = useRef<Map<number, HTMLElement>>(new Map())

  // Cargar baldosas
  useEffect(() => {
    async function fetchBaldosas() {
      try {
        const response = await fetch(
          `/api/baldosas/nearby?lat=-34.6037&lng=-58.3816&radius=10000`
        )
        const data = await response.json()
        console.log('Baldosas cargadas:', data.baldosas?.length || 0)
        setBaldosas(data.baldosas || [])
      } catch (error) {
        console.error('Error cargando baldosas:', error)
        setError('Error cargando datos de baldosas')
      }
    }

    fetchBaldosas()
  }, [])

  // Cargar scripts de A-Frame y MindAR
  useEffect(() => {
    const loadScripts = async () => {
      try {
        // Cargar A-Frame
        if (!window.AFRAME) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://aframe.io/releases/1.4.1/aframe.min.js'
            script.onload = () => {
              console.log('A-Frame cargado')
              resolve()
            }
            script.onerror = () => reject(new Error('Error cargando A-Frame'))
            document.head.appendChild(script)
          })
          await new Promise(resolve => setTimeout(resolve, 300))
        }

        // Cargar MindAR
        if (!window.MINDAR) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js'
            script.onload = () => {
              console.log('MindAR cargado')
              resolve()
            }
            script.onerror = () => reject(new Error('Error cargando MindAR'))
            document.head.appendChild(script)
          })
          await new Promise(resolve => setTimeout(resolve, 300))
        }

        setScriptsLoaded(true)
        setLoadingScripts(false)
      } catch (err) {
        console.error('Error cargando scripts:', err)
        setError('Error cargando librerías AR')
        setLoadingScripts(false)
      }
    }

    loadScripts()
  }, [])

  // Configurar eventos cuando la escena esté lista
  useEffect(() => {
    if (!scriptsLoaded || baldosas.length === 0) return

    const setupEvents = () => {
      const scene = sceneRef.current
      if (!scene) return

      // Esperar a que la escena esté cargada
      const onSceneLoaded = () => {
        console.log('Escena A-Frame cargada')
        setScannerReady(true)

        // Configurar eventos para cada target
        baldosas.forEach((baldosa) => {
          if (baldosa.targetIndex === undefined) return

          const targetEl = targetRefs.current.get(baldosa.targetIndex)
          if (!targetEl) return

          // Evento cuando se detecta el target
          targetEl.addEventListener('targetFound', () => {
            console.log('Target encontrado:', baldosa.nombre)
            setCurrentBaldosa(baldosa)
            
            // Reproducir audio si existe
            if (baldosa.audioUrl) {
              const audio = new Audio(baldosa.audioUrl)
              audio.play().catch(e => console.log('Audio no disponible'))
            }
          })

          // Evento cuando se pierde el target
          targetEl.addEventListener('targetLost', () => {
            console.log('Target perdido:', baldosa.nombre)
            setCurrentBaldosa(null)
          })
        })
      }

      // Cast to any para acceder a propiedades de A-Frame
      const aframeScene = scene as any
      if (aframeScene.hasLoaded) {
        onSceneLoaded()
      } else {
        scene.addEventListener('loaded', onSceneLoaded)
      }
    }

    // Pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(setupEvents, 500)
    return () => clearTimeout(timer)
  }, [scriptsLoaded, baldosas])

  // Registrar refs de los targets
  const registerTargetRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) {
      targetRefs.current.set(index, el)
    }
  }, [])

  // Loading state
  if (loadingScripts) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        background: 'var(--color-stone)',
        color: 'var(--color-parchment)',
      }}>
        <div className="loading" style={{ 
          borderColor: 'var(--color-parchment)', 
          borderTopColor: 'var(--color-primary)' 
        }} />
        <p>Cargando sistema AR...</p>
      </div>
    )
  }

  // Error state
  if (error || !scriptsLoaded) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
        background: 'var(--color-parchment)',
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h1 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>
            Error al cargar AR
          </h1>
          <p style={{ marginBottom: 'var(--space-md)', color: 'var(--color-concrete)' }}>
            {error || 'No se pudieron cargar las librerías necesarias.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn"
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      
      {/* Instrucciones */}
      {!currentBaldosa && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(26, 42, 58, 0.95)',
          color: 'var(--color-parchment)',
          padding: 'var(--space-lg)',
          borderRadius: '12px',
          textAlign: 'center',
          zIndex: 1000,
          maxWidth: '90%',
          width: '400px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>📷</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            marginBottom: 'var(--space-sm)',
          }}>
            Apuntá tu cámara a una baldosa
          </h2>
          <p style={{
            fontSize: '0.95rem',
            opacity: 0.9,
            marginBottom: 'var(--space-md)',
          }}>
            Cuando encuentres una baldosa de la memoria, enfocala con tu cámara para ver su historia
          </p>
          
          {!scannerReady && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: 'var(--space-sm)',
              background: 'rgba(37, 99, 235, 0.2)',
              borderRadius: '8px',
              marginBottom: 'var(--space-sm)',
            }}>
              <div className="loading" style={{ width: '16px', height: '16px' }} />
              <span style={{ fontSize: '0.85rem' }}>Iniciando cámara...</span>
            </div>
          )}
          
          {baldosas.length > 0 && (
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--color-accent)',
              padding: 'var(--space-xs) var(--space-sm)',
              background: 'rgba(14, 165, 233, 0.1)',
              borderRadius: '20px',
              display: 'inline-block',
            }}>
              {baldosas.length} baldosa{baldosas.length !== 1 ? 's' : ''} en el sistema
            </p>
          )}
        </div>
      )}

      {/* Info de baldosa detectada */}
      {currentBaldosa && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(26, 42, 58, 0.98), rgba(26, 42, 58, 0.9))',
          color: 'var(--color-parchment)',
          padding: 'var(--space-lg)',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          borderTop: '3px solid var(--color-primary)',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-md)',
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
            }}>
              ✓
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                marginBottom: 'var(--space-xs)',
                lineHeight: 1.2,
              }}>
                {currentBaldosa.nombre}
              </h2>
              <p style={{
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-accent)',
                marginBottom: 'var(--space-sm)',
              }}>
                {currentBaldosa.categoria}
              </p>
              {currentBaldosa.descripcion && (
                <p style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  opacity: 0.95,
                  maxHeight: '100px',
                  overflow: 'auto',
                }}>
                  {currentBaldosa.descripcion}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Escena A-Frame con MindAR */}
      <a-scene
        ref={(el: any) => { sceneRef.current = el }}
        mindar-image={`imageTargetSrc: /targets/targets.mind; autoStart: true; uiScanning: no; uiError: no; uiLoading: no;`}
        color-space="sRGB"
        renderer="colorManagement: true; physicallyCorrectLights: true"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        style={{ width: '100%', height: '100%' }}
      >
        <a-camera position="0 0 0" look-controls="enabled: false" />

        {baldosas.map((baldosa) => {
          if (baldosa.targetIndex === undefined) return null
          
          return (
            <a-entity
              key={baldosa.id}
              ref={(el: any) => registerTargetRef(baldosa.targetIndex, el)}
              mindar-image-target={`targetIndex: ${baldosa.targetIndex}`}
            >
              {/* Fondo del cartel */}
              <a-plane
                position="0 0.3 0"
                height="0.5"
                width="0.8"
                color="#ffffff"
                opacity="0.95"
                material="shader: flat"
              />
              
              {/* Barra superior azul */}
              <a-plane
                position="0 0.5 0.001"
                height="0.08"
                width="0.8"
                color="#2563eb"
                material="shader: flat"
              />
              
              {/* Nombre */}
              <a-text
                value={baldosa.nombre}
                color="#1a2a3a"
                align="center"
                width="1.5"
                position="0 0.35 0.01"
                font="roboto"
              />
              
              {/* Categoría */}
              <a-text
                value={baldosa.categoria.toUpperCase()}
                color="#2563eb"
                align="center"
                width="1"
                position="0 0.2 0.01"
                font="roboto"
              />
              
              {/* Mensaje AR */}
              <a-text
                value={baldosa.mensajeAR || ''}
                color="#4a6b7c"
                align="center"
                width="1.2"
                position="0 0.08 0.01"
                wrap-count="35"
                font="roboto"
              />
            </a-entity>
          )
        })}
      </a-scene>

      {/* Botón volver */}
      <a
        href="/mapa"
        style={{
          position: 'absolute',
          top: 'var(--space-md)',
          left: 'var(--space-md)',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'rgba(26, 42, 58, 0.9)',
          color: 'var(--color-parchment)',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 500,
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        ← Volver al mapa
      </a>

      {/* Estilos de animación */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
