/**
 * Layout exclusivo para /mapa
 * Omite navbar y footer del layout global
 * Next.js App Router: los layouts anidados reemplazan al padre
 * solo para las rutas que los contienen.
 *
 * IMPORTANTE: este archivo reemplaza el layout global SOLO para /mapa
 * Por eso no importa globals.css de nuevo — ya lo cargó el root layout.
 */
export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed',
      inset:     0,
      overflow: 'hidden',
      background: '#f0f4f8',
    }}>
      {children}
    </div>
  )
}
