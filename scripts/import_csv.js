#!/usr/bin/env node
/**
 * scripts/import_csv.js
 * ──────────────────────
 * Importa baldosas desde un archivo CSV a MongoDB.
 *
 * Columnas esperadas (separadas por TAB o coma, con encabezado):
 *   Barrio | Apellido y Nombre | Fecha | Dirección/Lugar | latitud | longitud
 *
 * Columnas opcionales (si están presentes se usan, si no se omiten):
 *   fotoUrl
 *
 * Uso:
 *   node scripts/import_csv.js ruta/al/archivo.csv
 *
 * Salida:
 *   - Inserta registros válidos en MongoDB
 *   - Genera  ruta/al/archivo.errores.csv  con los registros que fallaron
 *   - Genera  ruta/al/archivo.omitidos.csv con duplicados ya existentes en DB
 */

const { MongoClient } = require('mongodb')
const fs   = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// ─── Config ───────────────────────────────────────────────────────────────────

const MONGODB_URI     = process.env.MONGODB_URI
const CODIGO_INICIO   = 100   // BALD-0100 en adelante
const COLECCION       = 'baldosas'

// Límites geográficos de Argentina (bbox holgado)
const LAT_MIN = -55.0
const LAT_MAX = -21.0
const LNG_MIN = -74.0
const LNG_MAX = -53.0

// ─── Validar entorno ──────────────────────────────────────────────────────────

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local')
  process.exit(1)
}

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('❌ Uso: node scripts/import_csv.js ruta/al/archivo.csv')
  process.exit(1)
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Archivo no encontrado: ${csvPath}`)
  process.exit(1)
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Limpia texto: quita comillas externas, espacios, caracteres raros */
function limpiar(str) {
  if (str === undefined || str === null) return ''
  return String(str).replace(/^["']|["']$/g, '').trim()
}

/** Detecta separador del CSV (tab o coma) */
function detectarSeparador(primeraLinea) {
  const tabs   = (primeraLinea.match(/\t/g)   || []).length
  const comas  = (primeraLinea.match(/,/g)    || []).length
  const puntos = (primeraLinea.match(/;/g)    || []).length
  if (tabs >= comas && tabs >= puntos) return '\t'
  if (puntos >= comas)                 return ';'
  return ','
}

/** Parsea una línea de CSV respetando campos entre comillas */
function parsearLinea(linea, sep) {
  const resultado = []
  let campo = ''
  let dentroComillas = false

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (c === '"') {
      dentroComillas = !dentroComillas
    } else if (c === sep && !dentroComillas) {
      resultado.push(campo.trim())
      campo = ''
    } else {
      campo += c
    }
  }
  resultado.push(campo.trim())
  return resultado
}

/** Construye mensajeAR a partir del nombre */
function construirMensajeAR(nombre) {
  return `${nombre.toUpperCase()} — Presente`
}

/** Construye descripcion mínima si no viene en el CSV */
function construirDescripcion(nombre, fecha, direccion, barrio) {
  const partes = ['Militante popular, víctima del Terrorismo de Estado.']
  if (fecha)     partes.push(`Fecha: ${fecha}.`)
  if (direccion) partes.push(`Dirección: ${direccion}.`)
  if (barrio)    partes.push(`Barrio: ${barrio}.`)
  return partes.join(' ')
}

/** Formatea número de código: BALD-0100 */
function formatearCodigo(n) {
  return 'BALD-' + String(n).padStart(4, '0')
}

/** Valida coordenadas */
function validarCoordenadas(latStr, lngStr) {
  const errores = []

  // Reemplazar coma decimal por punto
  const latNorm = String(latStr).replace(',', '.')
  const lngNorm = String(lngStr).replace(',', '.')

  const lat = parseFloat(latNorm)
  const lng = parseFloat(lngNorm)

  if (isNaN(lat)) errores.push(`latitud inválida: "${latStr}"`)
  if (isNaN(lng)) errores.push(`longitud inválida: "${lngStr}"`)

  if (!isNaN(lat) && (lat < LAT_MIN || lat > LAT_MAX))
    errores.push(`latitud fuera de Argentina: ${lat} (esperado entre ${LAT_MIN} y ${LAT_MAX})`)

  if (!isNaN(lng) && (lng < LNG_MIN || lng > LNG_MAX))
    errores.push(`longitud fuera de Argentina: ${lng} (esperado entre ${LNG_MIN} y ${LNG_MAX})`)

  return { lat, lng, errores }
}


// ─── Leer y parsear CSV ───────────────────────────────────────────────────────

const contenido = fs.readFileSync(csvPath, 'utf-8')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n')

const lineas = contenido.split('\n').filter(l => l.trim() !== '')
if (lineas.length < 2) {
  console.error('❌ El CSV está vacío o solo tiene encabezado')
  process.exit(1)
}

const sep        = detectarSeparador(lineas[0])
const encabezado = parsearLinea(lineas[0], sep).map(h => limpiar(h).toLowerCase())

console.log(`\n📂 Archivo : ${csvPath}`)
console.log(`📋 Separador detectado: ${sep === '\t' ? 'TAB' : sep}`)
console.log(`📋 Columnas : ${encabezado.join(' | ')}\n`)

// Mapear nombres de columna a índices (flexible ante variaciones de nombre)
function buscarIndice(posibles) {
  for (const p of posibles) {
    const i = encabezado.findIndex(h => h.includes(p.toLowerCase()))
    if (i >= 0) return i
  }
  return -1
}

const IDX = {
  barrio:    buscarIndice(['barrio']),
  nombre:    buscarIndice(['apellido y nombre', 'apellido', 'nombre']),
  fecha:     buscarIndice(['fecha']),
  direccion: buscarIndice(['dirección', 'direccion', 'lugar']),
  lat:       buscarIndice(['latitud', 'lat']),
  lng:       buscarIndice(['longitud', 'lng', 'lon']),
  fotoUrl:   buscarIndice(['fotourl', 'foto_url', 'foto']),
}

// Verificar columnas obligatorias
const obligatorias = ['nombre', 'lat', 'lng']
const faltantes = obligatorias.filter(k => IDX[k] === -1)
if (faltantes.length > 0) {
  console.error(`❌ Columnas obligatorias no encontradas: ${faltantes.join(', ')}`)
  console.error(`   Columnas disponibles: ${encabezado.join(', ')}`)
  process.exit(1)
}


// ─── Procesar filas ───────────────────────────────────────────────────────────

const validos  = []   // { baldosa, filaOriginal, nLinea }
const errores  = []   // { filaOriginal, nLinea, motivos }

for (let i = 1; i < lineas.length; i++) {
  const campos       = parsearLinea(lineas[i], sep)
  const filaOriginal = lineas[i]
  const motivos      = []

  const nombre    = IDX.nombre    >= 0 ? limpiar(campos[IDX.nombre])    : ''
  const barrio    = IDX.barrio    >= 0 ? limpiar(campos[IDX.barrio])    : ''
  const fecha     = IDX.fecha     >= 0 ? limpiar(campos[IDX.fecha])     : ''
  const direccion = IDX.direccion >= 0 ? limpiar(campos[IDX.direccion]) : ''
  const latStr    = IDX.lat       >= 0 ? limpiar(campos[IDX.lat])       : ''
  const lngStr    = IDX.lng       >= 0 ? limpiar(campos[IDX.lng])       : ''
  const fotoUrl   = IDX.fotoUrl   >= 0 ? limpiar(campos[IDX.fotoUrl])  : ''

  // Validar nombre
  if (!nombre) motivos.push('nombre vacío')

  // Validar coordenadas
  const { lat, lng, errores: errCoords } = validarCoordenadas(latStr, lngStr)
  motivos.push(...errCoords)

  if (motivos.length > 0) {
    errores.push({ filaOriginal, nLinea: i + 1, motivos })
    continue
  }

  const baldosa = {
    // codigo se asigna después contra la DB
    nombre,
    descripcion:  construirDescripcion(nombre, fecha, direccion, barrio),
    ubicacion: {
      type:        'Point',
      coordinates: [lng, lat],   // GeoJSON: [longitud, latitud]
    },
    direccion,
    barrio,
    fotoUrl:      fotoUrl || null,
    imagenUrl:    null,
    mensajeAR:    construirMensajeAR(nombre),
    infoExtendida: fecha ? `Fecha registrada: ${fecha}.` : '',
    vecesEscaneada: 0,
    activo:       true,
    createdAt:    new Date(),
    updatedAt:    new Date(),
    // Guardamos lat/lng por separado para comparar con DB
    _lat: lat,
    _lng: lng,
  }

  validos.push({ baldosa, filaOriginal, nLinea: i + 1 })
}

console.log(`✅ Filas parseadas   : ${lineas.length - 1}`)
console.log(`✅ Válidas           : ${validos.length}`)
console.log(`❌ Con errores       : ${errores.length}\n`)


// ─── Conectar a MongoDB y procesar ───────────────────────────────────────────

async function importar() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('✅ Conectado a MongoDB\n')

    const db  = client.db()
    const col = db.collection(COLECCION)

    // ── Determinar próximo número de código disponible ────────────────────────
    // Busca el código más alto ya existente con patrón BALD-XXXX
    const ultimo = await col
      .find({ codigo: /^BALD-\d+$/ })
      .sort({ codigo: -1 })
      .limit(1)
      .toArray()

    let proximoNum = CODIGO_INICIO
    if (ultimo.length > 0) {
      const numExistente = parseInt(ultimo[0].codigo.replace('BALD-', ''), 10)
      if (numExistente >= CODIGO_INICIO) {
        proximoNum = numExistente + 1
      }
    }
    console.log(`🔢 Próximo código   : ${formatearCodigo(proximoNum)}\n`)

    // ── Detectar duplicados por nombre + coordenadas aproximadas ─────────────
    const omitidos  = []
    const aInsertar = []

    for (const item of validos) {
      const { baldosa } = item

      // Duplicado exacto: mismo nombre Y coordenadas a menos de ~10m
      const dup = await col.findOne({
        nombre: baldosa.nombre,
        ubicacion: {
          $near: {
            $geometry:    { type: 'Point', coordinates: baldosa.ubicacion.coordinates },
            $maxDistance: 10,
          },
        },
      }).catch(() => null)  // puede fallar si no existe índice 2dsphere aún

      // Fallback sin índice espacial: comparar coordenadas exactas
      const dupExacto = dup ?? await col.findOne({
        nombre:                            baldosa.nombre,
        'ubicacion.coordinates.0':         baldosa.ubicacion.coordinates[0],
        'ubicacion.coordinates.1':         baldosa.ubicacion.coordinates[1],
      })

      if (dupExacto) {
        omitidos.push({ ...item, codigoExistente: dupExacto.codigo })
      } else {
        // Asignar código correlativo
        baldosa.codigo = formatearCodigo(proximoNum++)
        // Limpiar campos internos de trabajo
        delete baldosa._lat
        delete baldosa._lng
        aInsertar.push({ ...item, baldosa })
      }
    }

    console.log(`📥 A insertar       : ${aInsertar.length}`)
    console.log(`⏭️  Duplicados       : ${omitidos.length}\n`)

    // ── Insertar ──────────────────────────────────────────────────────────────
    let insertados = 0
    if (aInsertar.length > 0) {
      const docs   = aInsertar.map(i => i.baldosa)
      const result = await col.insertMany(docs, { ordered: false })
      insertados   = Object.keys(result.insertedIds).length
      console.log(`✅ Insertadas: ${insertados} baldosas\n`)
      aInsertar.forEach(i =>
        console.log(`   ${i.baldosa.codigo} — ${i.baldosa.nombre} (${i.baldosa.direccion || i.baldosa.barrio})`)
      )
    }

    // ── Índice geoespacial ────────────────────────────────────────────────────
    await col.createIndex({ ubicacion: '2dsphere' })
    console.log('\n🗺️  Índice 2dsphere asegurado')

    // ── Resumen final ─────────────────────────────────────────────────────────
    const total = await col.countDocuments()
    console.log('\n📊 Resumen:')
    console.log(`   Total en DB      : ${total}`)
    console.log(`   Insertadas hoy   : ${insertados}`)
    console.log(`   Omitidas (dup)   : ${omitidos.length}`)
    console.log(`   Con errores      : ${errores.length}`)

    // ── Generar archivo de errores ────────────────────────────────────────────
    const baseNombre = csvPath.replace(/\.[^.]+$/, '')

    if (errores.length > 0) {
      const errPath  = `${baseNombre}.errores.csv`
      const encError = encabezado.join(sep === '\t' ? '\t' : ',') + (sep === '\t' ? '\t' : ',') + 'MOTIVO_ERROR'
      const filasErr = errores.map(e =>
        e.filaOriginal + (sep === '\t' ? '\t' : ',') + '"' + e.motivos.join('; ') + '"'
      )
      fs.writeFileSync(errPath, [encError, ...filasErr].join('\n'), 'utf-8')
      console.log(`\n❌ Errores exportados a : ${errPath}`)
    }

    // ── Generar archivo de omitidos ───────────────────────────────────────────
    if (omitidos.length > 0) {
      const omPath  = `${baseNombre}.omitidos.csv`
      const encOm   = encabezado.join(sep === '\t' ? '\t' : ',') + (sep === '\t' ? '\t' : ',') + 'CODIGO_EXISTENTE'
      const filasOm = omitidos.map(o =>
        o.filaOriginal + (sep === '\t' ? '\t' : ',') + o.codigoExistente
      )
      fs.writeFileSync(omPath, [encOm, ...filasOm].join('\n'), 'utf-8')
      console.log(`⏭️  Omitidos exportados a: ${omPath}`)
    }

    console.log('\n🎉 Importación completada\n')

  } catch (err) {
    console.error('\n❌ Error durante la importación:', err.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

importar()
