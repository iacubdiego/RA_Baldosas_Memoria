'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NavbarWrapper() {
  const pathname = usePathname()
  const esHome = pathname === '/'

  // fase 0: oculta | fase 1: mitad superior visible | fase 2: completa | fase 3: contenido visible
  const [fase, setFase] = useState(esHome ? 0 : 3)

  useEffect(() => {
    if (!esHome) {
      setFase(3)
      return
    }
    // 2.5s — empieza a revelar la mitad superior
    const t1 = setTimeout(() => setFase(1), 2500)
    // 3.4s — revela la mitad inferior (0.9s después)
    const t2 = setTimeout(() => setFase(2), 3400)
    // 3.9s — aparece el contenido
    const t3 = setTimeout(() => setFase(3), 3900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [esHome])

  // clip-path recorta la navbar de arriba hacia abajo en dos etapas
  // inset(top right bottom left) — reducimos bottom de 100% → 50% → 0%
  const clipPath = esHome
    ? fase === 0 ? 'inset(0 0 100% 0)'
    : fase === 1 ? 'inset(0 0 50% 0)'
    : 'inset(0 0 0% 0)'
    : undefined

  const clipTransition = esHome
    ? fase === 1
      ? 'clip-path 0.8s cubic-bezier(0.45, 0, 0.15, 1)'   // mitad superior: desacelera al llegar
      : fase >= 2
        ? 'clip-path 0.7s cubic-bezier(0.45, 0, 0.15, 1)' // mitad inferior: igual
        : 'none'
    : undefined

  return (
    <nav
      className="navbar"
      style={esHome ? {
        clipPath,
        // max-height controla el espacio que ocupa en el layout (empuja el contenido)
        maxHeight:  fase === 0 ? '0' : '200px',
        overflow:   fase === 0 ? 'hidden' : 'visible',
        transition: clipTransition
          ? `${clipTransition}, max-height 1.5s cubic-bezier(0.45, 0, 0.15, 1)`
          : fase > 0 ? 'max-height 1.5s cubic-bezier(0.45, 0, 0.15, 1)' : 'none',
        willChange: 'clip-path',
      } : undefined}
    >
      <div
        className="navbar-container"
        style={esHome ? {
          opacity:    fase >= 3 ? 1 : 0,
          transform:  fase >= 3 ? 'translateY(0)' : 'translateY(-6px)',
          transition: fase >= 3
            ? 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'none',
        } : undefined}
      >
        <div className="navbar-brand">
          <a href="/" className="navbar-logo-link">
            <img
              src="/images/logo_flores.png"
              alt="Pañuelo"
              className="navbar-logo"
            />
            <span className="navbar-title">Recorremos Memoria</span>
          </a>
        </div>

        <div className="navbar-links">
          <a href="/scanner"   className="navbar-link">Encontrar</a>
          <a href="/mapa"      className="navbar-link">Mapa</a>
          <a href="/coleccion" className="navbar-link">Mi Recorrido</a>
        </div>
      </div>
    </nav>
  )
}
