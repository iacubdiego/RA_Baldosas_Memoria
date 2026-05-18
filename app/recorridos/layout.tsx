/**
 * Layout de /recorridos
 * Passthrough. El layout fullscreen (que oculta navbar/footer y fija la
 * pantalla) se movió a /recorridos/escuela/[id]/layout.tsx, donde sí hace
 * falta porque el mapa ocupa toda la viewport.
 *
 * El listado de escuelas (/recorridos/escuela) usa el layout global con
 * navbar + footer + scroll normal.
 */
export default function RecorridosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
