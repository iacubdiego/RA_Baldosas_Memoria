/**
 * Layout exclusivo para /recorridos
 * Omite navbar y footer del layout global, igual que /mapa
 */
export default function RecorridosLayout({ children }: { children: React.ReactNode }) {
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
