/**
 * Generador de mapa estático a partir de tiles del WMS de IGN.
 *
 * Compone una imagen PNG centrada en una coordenada con un zoom calculado
 * a partir de un radio en metros. Dibuja marcadores (escuela + baldosas) y
 * un círculo sutil indicando el radio.
 *
 * Se usa server-side desde el endpoint que genera el PDF.
 *
 * No depende de Leaflet. Solo de:
 *   - fetch global de Node 18+
 *   - sharp (para composición de imágenes)
 *
 * Las tiles vienen del TMS de IGN Argenmap:
 *   https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/
 *     capabaseargenmap@EPSG:3857@png/{z}/{x}/{y}.png
 *
 * Importante: TMS de IGN usa Y invertido respecto del esquema XYZ estándar.
 *   Y_tms = (2^z - 1) - Y_xyz
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const TILE_SIZE = 256
const IGN_TMS = 'https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG:3857@png'

export interface Marker {
  lat: number
  lng: number
  /** 'escuela' | 'baldosa' — define el ícono dibujado */
  tipo: 'escuela' | 'baldosa'
  /** Etiqueta opcional para mostrar al lado del marcador */
  label?: string
}

export interface StaticMapOptions {
  centerLat: number
  centerLng: number
  /** Radio en metros — se dibuja como círculo y determina el zoom */
  radio: number
  /** Ancho de la imagen final en px */
  width: number
  /** Alto de la imagen final en px */
  height: number
  /** Marcadores a dibujar sobre el mapa */
  markers: Marker[]
}

// ─── Conversiones Web Mercator (EPSG:3857) ────────────────────────────────

/** Convierte lat/lng a coordenadas de tile fraccionarias en un zoom dado */
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom
  const x = ((lng + 180) / 360) * n
  const latRad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  return { x, y }
}

/** Convierte lat/lng a coordenadas globales en píxeles (a zoom dado) */
function latLngToPixel(lat: number, lng: number, zoom: number) {
  const { x, y } = latLngToTile(lat, lng, zoom)
  return { x: x * TILE_SIZE, y: y * TILE_SIZE }
}

/**
 * Calcula el zoom óptimo para que un círculo del radio dado entre dentro
 * de la imagen con un poco de margen. Usa la dimensión MÁS CHICA (entre
 * ancho y alto) para garantizar que el círculo completo se vea en la imagen
 * — antes solo consideraba el ancho, lo cual cortaba baldosas que estaban
 * dentro del radio pero fuera del rectángulo del mapa.
 */
function calcularZoom(centerLat: number, radio: number, width: number, height: number): number {
  // En Web Mercator a zoom z, un píxel cubre:
  //   metros/px = (cos(lat) * 2πR) / (256 * 2^z)
  // Despejando z para que (radio * 2 * margin) entre en min(width, height) píxeles:
  const margin = 1.05
  const earthR = 6378137 // m
  const cosLat = Math.cos((centerLat * Math.PI) / 180)
  const dimensionMenor = Math.min(width, height)
  const metersPerPx = (radio * 2 * margin) / dimensionMenor
  const z = Math.log2((cosLat * 2 * Math.PI * earthR) / (256 * metersPerPx))
  return Math.max(10, Math.min(18, Math.round(z)))
}

// ─── Descarga de tiles ────────────────────────────────────────────────────

/**
 * Convierte Y del esquema XYZ estándar a Y del esquema TMS (Y invertido).
 */
function tmsY(yXyz: number, zoom: number): number {
  return (2 ** zoom) - 1 - yXyz
}

/** Descarga una tile como Buffer. Devuelve null si falla. */
async function fetchTile(z: number, x: number, y: number): Promise<Buffer | null> {
  const yT = tmsY(y, z)
  const url = `${IGN_TMS}/${z}/${x}/${yT}.png`
  try {
    const res = await fetch(url, {
      // IGN suele tardar un poco — damos margen
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.warn(`[staticMapIGN] Tile ${z}/${x}/${y} HTTP ${res.status}`)
      return null
    }
    return Buffer.from(await res.arrayBuffer())
  } catch (e) {
    console.warn(`[staticMapIGN] Tile ${z}/${x}/${y} fetch error:`, e)
    return null
  }
}

// ─── Render de marcadores y radio como SVG overlay ────────────────────────

/**
 * Calcula posiciones de marcadores en píxeles relativos a la imagen final
 * y genera el SVG con el círculo del radio (sin marcadores — los marcadores
 * se componen aparte como PNGs).
 */
interface MarkerPos {
  x: number
  y: number
  tipo: 'escuela' | 'baldosa'
}

function calcularPosicionesYRadioSVG(
  opts: StaticMapOptions,
  zoom: number,
  pxCenterX: number,
  pxCenterY: number,
  imgX0: number,
  imgY0: number,
): { svgRadio: string; posiciones: MarkerPos[] } {
  const { width, height, centerLat, radio, markers } = opts

  // Radio en píxeles
  const earthR = 6378137
  const cosLat = Math.cos((centerLat * Math.PI) / 180)
  const metersPerPx = (cosLat * 2 * Math.PI * earthR) / (256 * 2 ** zoom)
  const radioPx = radio / metersPerPx

  // Posiciones de marcadores (filtradas para que estén dentro del bounding visual)
  const posiciones: MarkerPos[] = markers
    .map(m => {
      const px = latLngToPixel(m.lat, m.lng, zoom)
      return { x: px.x - imgX0, y: px.y - imgY0, tipo: m.tipo }
    })
    .filter(p => p.x >= -25 && p.x <= width + 25 && p.y >= -25 && p.y <= height + 25)

  // SVG solo con el círculo del radio
  const svgRadio = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <circle cx="${pxCenterX.toFixed(1)}" cy="${pxCenterY.toFixed(1)}" r="${radioPx.toFixed(1)}"
            fill="#2563eb" fill-opacity="0.08"
            stroke="#2563eb" stroke-opacity="0.45" stroke-width="1.5"
            stroke-dasharray="6 4"/>
  </svg>`

  return { svgRadio, posiciones }
}

// ─── Iconos de marcadores (cargados una vez, cacheados) ───────────────────

const ICON_SIZE_BALDOSA = 32
const ICON_SIZE_ESCUELA = 40

let cacheIconoBaldosa: Buffer | null = null
let cacheIconoEscuela: Buffer | null = null

/**
 * Carga y resizea el ícono del pañuelo desde public/images/.
 * Cacheado en memoria entre llamadas del server.
 */
async function getIconoBaldosa(): Promise<Buffer | null> {
  if (cacheIconoBaldosa) return cacheIconoBaldosa
  const p = path.join(process.cwd(), 'public', 'images', 'logo_flores_fondo_azul.png')
  if (!fs.existsSync(p)) {
    console.warn('[staticMapIGN] No se encontró logo_flores_fondo_azul.png en', p)
    return null
  }
  try {
    cacheIconoBaldosa = await sharp(p)
      .resize(ICON_SIZE_BALDOSA, ICON_SIZE_BALDOSA, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    return cacheIconoBaldosa
  } catch (e) {
    console.warn('[staticMapIGN] Error cargando icono baldosa:', e)
    return null
  }
}

/**
 * Carga y resizea el ícono de escuela desde public/images/.
 * Cacheado en memoria entre llamadas del server.
 */
async function getIconoEscuela(): Promise<Buffer | null> {
  if (cacheIconoEscuela) return cacheIconoEscuela
  const p = path.join(process.cwd(), 'public', 'images', 'icono_escuela.png')
  if (!fs.existsSync(p)) {
    console.warn('[staticMapIGN] No se encontró icono_escuela.png en', p)
    return null
  }
  try {
    cacheIconoEscuela = await sharp(p)
      .resize(ICON_SIZE_ESCUELA, ICON_SIZE_ESCUELA, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    return cacheIconoEscuela
  } catch (e) {
    console.warn('[staticMapIGN] Error cargando icono escuela:', e)
    return null
  }
}

// ─── Función principal ────────────────────────────────────────────────────

/**
 * Genera la imagen estática del mapa.
 * Devuelve un Buffer PNG listo para incluir en un PDF.
 */
export async function generarMapaEstaticoIGN(opts: StaticMapOptions): Promise<Buffer> {
  const { centerLat, centerLng, width, height } = opts
  const zoom = calcularZoom(centerLat, opts.radio, width, height)

  // Coordenadas globales del centro en píxeles
  const center = latLngToPixel(centerLat, centerLng, zoom)

  // Origen de la imagen final en coordenadas globales de píxeles
  const imgX0 = center.x - width / 2
  const imgY0 = center.y - height / 2

  // Rango de tiles a descargar
  const tileX0 = Math.floor(imgX0 / TILE_SIZE)
  const tileX1 = Math.ceil((imgX0 + width) / TILE_SIZE) - 1
  const tileY0 = Math.floor(imgY0 / TILE_SIZE)
  const tileY1 = Math.ceil((imgY0 + height) / TILE_SIZE) - 1

  const tiles: { x: number; y: number; buf: Buffer | null }[] = []
  const promises: Promise<void>[] = []
  for (let x = tileX0; x <= tileX1; x++) {
    for (let y = tileY0; y <= tileY1; y++) {
      promises.push(
        fetchTile(zoom, x, y).then(buf => {
          tiles.push({ x, y, buf })
        })
      )
    }
  }
  await Promise.all(promises)

  // Lienzo base: si alguna tile falla, queda gris claro en su lugar
  let composite = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 232, g: 235, b: 238, alpha: 1 },
    },
  })

  // Composición: cada tile en su offset respecto a la imagen final
  const overlays: sharp.OverlayOptions[] = []
  for (const t of tiles) {
    if (!t.buf) continue
    const offsetX = t.x * TILE_SIZE - imgX0
    const offsetY = t.y * TILE_SIZE - imgY0
    overlays.push({
      input: t.buf,
      left: Math.round(offsetX),
      top: Math.round(offsetY),
    })
  }

  // Overlay con el círculo del radio (SVG) y obtener posiciones de marcadores
  const { svgRadio, posiciones } = calcularPosicionesYRadioSVG(
    opts,
    zoom,
    center.x - imgX0,
    center.y - imgY0,
    imgX0,
    imgY0,
  )
  overlays.push({
    input: Buffer.from(svgRadio),
    top: 0,
    left: 0,
  })

  // Cargar íconos PNG para marcadores (con cache entre llamadas)
  const [iconoBaldosa, iconoEscuela] = await Promise.all([
    getIconoBaldosa(),
    getIconoEscuela(),
  ])

  // Agregar los marcadores como overlays PNG sobre el mapa
  for (const pos of posiciones) {
    const icono = pos.tipo === 'escuela' ? iconoEscuela : iconoBaldosa
    const size = pos.tipo === 'escuela' ? ICON_SIZE_ESCUELA : ICON_SIZE_BALDOSA
    if (!icono) continue
    overlays.push({
      input: icono,
      // Centrar el ícono en la posición (x, y) restando la mitad del tamaño
      left: Math.round(pos.x - size / 2),
      top: Math.round(pos.y - size / 2),
    })
  }

  return await composite.composite(overlays).png().toBuffer()
}
