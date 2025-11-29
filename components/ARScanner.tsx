'use client'

import { useEffect, useState, useRef } from 'react'

interface Baldosa {
  id: string
  nombre: string
  categoria: string
  mensajeAR: string
  descripcion?: string
  imagenUrl: string
  audioUrl?: string
}

export default function ARScanner() {
  const [currentBaldosa, setCurrentBaldosa] = useState<Baldosa | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [nearbyBaldosas, setNearbyBaldosas] = useState<any[]>([])
  const [currentCluster, setCurrentCluster] = useState<any>(null)
  const sceneRef = useRef<any>(null)

  useEffect(() => {
    // Cargar scripts de A-Frame y MindAR
    const loadScripts = async () => {
      // A-Frame
      if (!document.querySelector('script[src*="aframe"]')) {
        const aframeScript = document.createElement('script')
        aframeScript.src = 'https://aframe.io/releases/1.4.1/aframe.min.js'
        document.head.appendChild(aframeScript)
        
        await new Promise(resolve => {
          aframeScript.onload = resolve
        })
      }

      // MindAR
      if (!document.querySelector('script[src*="mindar-image-aframe"]')) {
        const mindarScript = document.createElement('script')
        mindarScript.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js'
        document.head.appendChild(mindarScript)
        
        await new Promise(resolve => {
          mindarScript.onload = resolve
        })
      }

      // Obtener ubicación y baldosas cercanas
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch(
                `/api/baldosas/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}&radius=500`
              )
              const data = await response.json()
              
              setNearbyBaldosas(data.baldosas || [])
              
              if (data.clusters && data.clusters.length > 0) {
                const closestCluster = data.clusters[0]
                setCurrentCluster(closestCluster)
              }
            } catch (error) {
              console.error('Error cargando baldosas:', error)
            }
          },
          (error) => {
            console.error('Error obteniendo ubicación:', error)
          }
        )
      }
    }

    loadScripts()

    return () => {
      // Cleanup
      if (sceneRef.current) {
        const scene = sceneRef.current
        if (scene.systems && scene.systems['mindar-image-system']) {
          scene.systems['mindar-image-system'].stop()
        }
      }
    }
  }, [])

  const handleTargetFound = (baldosa: Baldosa) => {
    setCurrentBaldosa(baldosa)
    setIsScanning(true)
    
    // Reproducir audio si existe
    if (baldosa.audioUrl) {
      const audio = new Audio(baldosa.audioUrl)
      audio.play().catch(e => console.error('Error reproduciendo audio:', e))
    }
  }

  const handleTargetLost = () => {
    setCurrentBaldosa(null)
    setIsScanning(false)
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* Instrucciones */}
      {!isScanning && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(42, 37, 32, 0.9)',
          color: 'var(--color-parchment)',
          padding: 'var(--space-lg)',
          borderRadius: '8px',
          textAlign: 'center',
          zIndex: 1000,
          maxWidth: '90%',
          backdropFilter: 'blur(10px)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            marginBottom: 'var(--space-sm)',
          }}>
            Apunta tu cámara a una baldosa
          </h2>
          <p style={{
            fontSize: '0.95rem',
            opacity: 0.9,
            marginBottom: 'var(--space-md)',
          }}>
            Cuando encuentres una baldosa cerca, enfócala con tu cámara para ver su historia
          </p>
          {nearbyBaldosas.length > 0 && (
            <div>
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--color-terracota)',
                marginBottom: 'var(--space-xs)',
              }}>
                {nearbyBaldosas.length} baldosa{nearbyBaldosas.length !== 1 ? 's' : ''} cerca:
              </p>
              <div style={{
                maxHeight: '150px',
                overflowY: 'auto',
                fontSize: '0.85rem',
              }}>
                {nearbyBaldosas.slice(0, 5).map(b => (
                  <div key={b.id} style={{ marginBottom: 'var(--space-xs)' }}>
                    • {b.nombre} ({b.distancia}m)
                  </div>
                ))}
              </div>
            </div>
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
          background: 'rgba(42, 37, 32, 0.95)',
          color: 'var(--color-parchment)',
          padding: 'var(--space-lg)',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          borderTop: '3px solid var(--color-terracota)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            marginBottom: 'var(--space-xs)',
          }}>
            {currentBaldosa.nombre}
          </h2>
          <p style={{
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-terracota)',
            marginBottom: 'var(--space-sm)',
          }}>
            {currentBaldosa.categoria}
          </p>
          {currentBaldosa.descripcion && (
            <p style={{
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: 'var(--space-sm)',
              opacity: 0.95,
            }}>
              {currentBaldosa.descripcion}
            </p>
          )}
          <a
            href={`/baldosa/${currentBaldosa.id}`}
            style={{
              display: 'inline-block',
              marginTop: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'var(--color-terracota)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Ver información completa →
          </a>
        </div>
      )}

      {/* Escena A-Frame */}
      <a-scene
        ref={sceneRef}
        mindar-image={currentCluster?.mindFileUrl ? `imageTargetSrc: ${currentCluster.mindFileUrl}; autoStart: true; uiScanning: no; uiError: no;` : ''}
        color-space="sRGB"
        renderer="colorManagement: true, physicallyCorrectLights"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        style={{ width: '100%', height: '100%' }}
      >
        <a-camera position="0 0 0" look-controls="enabled: false" />

        {nearbyBaldosas.map((baldosa, index) => {
          if (!baldosa.targetIndex && baldosa.targetIndex !== 0) return null
          
          return (
            <a-entity
              key={baldosa.id}
              mindar-image-target={`targetIndex: ${baldosa.targetIndex}`}
              // @ts-ignore
              target-found={() => handleTargetFound(baldosa)}
              // @ts-ignore
              target-lost={handleTargetLost}
            >
              {/* Plano de fondo */}
              <a-plane
                position="0 0 0"
                height="0.6"
                width="1.2"
                rotation="0 0 0"
                color="#f5f1ed"
                opacity="0.95"
                material="shader: flat"
              />

              {/* Texto AR */}
              <a-text
                value={baldosa.mensajeAR || baldosa.nombre}
                color="#2a2520"
                align="center"
                width="1.8"
                position="0 0 0.01"
                wrap-count="30"
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
          background: 'rgba(42, 37, 32, 0.9)',
          color: 'var(--color-parchment)',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '0.9rem',
          fontWeight: 500,
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
        }}
      >
        ← Volver al mapa
      </a>
    </div>
  )
}
