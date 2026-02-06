// lib/coleccion.ts - Sistema de colección (sin autenticación)

export interface ItemColeccion {
  id: string;
  baldosaId: string;
  nombreVictima: string;
  fechaDesaparicion?: string;
  fechaEscaneo: string;
  fotoUrl: string;
  ubicacion: string;
  notas?: string;
  lat?: number;
  lng?: number;
}

export interface Coleccion {
  items: ItemColeccion[];
  totalEscaneos: number;
  ultimoEscaneo?: string;
}

const COLECCION_KEY = 'baldosas_coleccion';

export function obtenerColeccion(): Coleccion {
  if (typeof window === 'undefined') {
    return { items: [], totalEscaneos: 0 };
  }

  const coleccionStr = localStorage.getItem(COLECCION_KEY);
  
  if (!coleccionStr) {
    return { items: [], totalEscaneos: 0 };
  }

  try {
    return JSON.parse(coleccionStr);
  } catch {
    return { items: [], totalEscaneos: 0 };
  }
}

function guardarColeccion(coleccion: Coleccion): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COLECCION_KEY, JSON.stringify(coleccion));
}

export function agregarAColeccion(item: Omit<ItemColeccion, 'id' | 'fechaEscaneo'>): ItemColeccion {
  const coleccion = obtenerColeccion();
  
  const nuevoItem: ItemColeccion = {
    ...item,
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fechaEscaneo: new Date().toISOString()
  };

  coleccion.items.unshift(nuevoItem);
  coleccion.totalEscaneos = coleccion.items.length;
  coleccion.ultimoEscaneo = nuevoItem.fechaEscaneo;

  guardarColeccion(coleccion);
  
  return nuevoItem;
}

export function baldosaEnColeccion(baldosaId: string): boolean {
  const coleccion = obtenerColeccion();
  return coleccion.items.some(item => item.baldosaId === baldosaId);
}

export function obtenerItemPorId(itemId: string): ItemColeccion | null {
  const coleccion = obtenerColeccion();
  return coleccion.items.find(item => item.id === itemId) || null;
}

export function obtenerItemPorBaldosaId(baldosaId: string): ItemColeccion | null {
  const coleccion = obtenerColeccion();
  return coleccion.items.find(item => item.baldosaId === baldosaId) || null;
}

export function actualizarNotas(itemId: string, notas: string): boolean {
  const coleccion = obtenerColeccion();
  const item = coleccion.items.find(i => i.id === itemId);
  
  if (!item) return false;
  
  item.notas = notas;
  guardarColeccion(coleccion);
  return true;
}

export function eliminarDeColeccion(itemId: string): boolean {
  const coleccion = obtenerColeccion();
  const indexInicial = coleccion.items.length;
  
  coleccion.items = coleccion.items.filter(item => item.id !== itemId);
  
  if (coleccion.items.length < indexInicial) {
    coleccion.totalEscaneos = coleccion.items.length;
    coleccion.ultimoEscaneo = coleccion.items[0]?.fechaEscaneo;
    guardarColeccion(coleccion);
    return true;
  }
  
  return false;
}

export function obtenerEstadisticas() {
  const coleccion = obtenerColeccion();
  
  const escaneosPorMes: { [key: string]: number } = {};
  coleccion.items.forEach(item => {
    const fecha = new Date(item.fechaEscaneo);
    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    escaneosPorMes[mesKey] = (escaneosPorMes[mesKey] || 0) + 1;
  });

  const ubicacionesUnicas = new Set(coleccion.items.map(item => item.ubicacion));

  return {
    totalBaldosas: coleccion.items.length,
    ubicacionesVisitadas: ubicacionesUnicas.size,
    primeraVisita: coleccion.items[coleccion.items.length - 1]?.fechaEscaneo,
    ultimaVisita: coleccion.items[0]?.fechaEscaneo,
    escaneosPorMes
  };
}

export function limpiarColeccion(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COLECCION_KEY);
}

export function exportarColeccion(): string {
  const coleccion = obtenerColeccion();
  return JSON.stringify(coleccion, null, 2);
}
