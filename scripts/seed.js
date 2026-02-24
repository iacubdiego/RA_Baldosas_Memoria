#!/usr/bin/env node
/**
 * scripts/seed.js
 * ────────────────
 * Carga las baldosas de ejemplo en MongoDB.
 * Versión location-based: no requiere archivos .mind ni targetIndex.
 *
 * Uso:
 *   node scripts/seed.js
 */

const { MongoClient } = require('mongodb')
require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local')
  process.exit(1)
}

// ─── Datos ────────────────────────────────────────────────────────────────────
// Cada baldosa requiere solo:
//   codigo, nombre, descripcion, categoria,
//   ubicacion { type:'Point', coordinates:[lng, lat] },
//   direccion, barrio, imagenUrl, fotoUrl, mensajeAR, infoExtendida

const baldosas = [

  // ── 1 ──────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0005',
    nombre: 'Ángela Auad',
    descripcion: 'Militante popular. Secuestrada el 8 de diciembre de 1977 en la Iglesia de la Santa Cruz junto a fundadoras de Madres de Plaza de Mayo. Sus restos probaron la existencia de los "vuelos de la muerte".',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4058, -34.5877],   // Charcas 4335, Palermo
    },
    direccion: 'Charcas 4335',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Angela+Auad',
    fotoUrl: '/images/fotos/BALD-0005.jpg',
    mensajeAR: 'ÁNGELA AUAD — Presente',
    infoExtendida: 'Ángela Auad (1945–1977), oriunda de Jujuy, militó en Vanguardia Comunista y luego se vinculó a Madres de Plaza de Mayo mientras su pareja estaba presa en el Chaco. El 8 de diciembre de 1977, Alfredo Astiz la señaló con un abrazo en el atrio de la Iglesia de la Santa Cruz. Fue trasladada a la ESMA y arrojada viva al mar. Sus restos aparecieron en las costas bonaerenses y, analizados por el EAAF, constituyeron prueba forense decisiva de la existencia de los "vuelos de la muerte". Fue sepultada en 2005 en el jardín de la Iglesia de Santa Cruz junto a la hermana Léonie Duquet. Baldosa colocada el 19 de febrero de 2013, Charcas 4335, Palermo.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ── 2 ──────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0006',
    nombre: 'Oscar Hueravilo y Mirta Alonso',
    descripcion: 'Pareja de militantes del PC. Mirta, embarazada de 6 meses, fue secuestrada en el velorio de su abuelo el 19 de mayo de 1977. Dio a luz a su hijo Emiliano en la ESMA.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4328, -34.5935],   // Fitz Roy 2294, Palermo
    },
    direccion: 'Fitz Roy 2294',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Hueravilo+Alonso',
    fotoUrl: '/images/fotos/BALD-0006.jpg',
    mensajeAR: 'OSCAR Y MIRTA — Presentes',
    infoExtendida: 'Oscar Hueravilo (23 años) y Mirta Alonso (24 años) trabajaban en las Bodegas Peñaflor, cursaban estudios universitarios y militaban en el Partido Comunista. Mirta era además docente. La noche del 19 de mayo de 1977 intentaron secuestrarlos en el velorio del abuelo de Mirta; como solo estaba ella, se la llevaron y más tarde fueron por Oscar al domicilio de Fitz Roy 2294. Mirta estaba embarazada de seis meses. Dio a luz a Emiliano Lautaro el 11 de agosto de 1977 en el Casino de Oficiales de la ESMA. Logró amamantarlo tres semanas antes del "traslado". El bebé fue abandonado en Casa Cuna; sus abuelos lo recuperaron el 14 de diciembre de 1977. Emiliano es hoy fundador de la agrupación HIJOS. Baldosa colocada el 16 de marzo de 2013, Fitz Roy 2294, Palermo.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ── 3 ──────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0007',
    nombre: 'Enrique Desimone',
    descripcion: 'Militante popular detenido y desaparecido el 22 de noviembre de 1976 en Palermo. Su hermana describió la baldosa como el momento en que "renació".',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4136, -34.5917],   // Soler 3693, Palermo
    },
    direccion: 'Soler 3693',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Enrique+Desimone',
    fotoUrl: '/images/fotos/BALD-0007.jpg',
    mensajeAR: 'ENRIQUE DESIMONE — Presente',
    infoExtendida: 'Enrique Desimone Fernández fue detenido y desaparecido el 22 de noviembre de 1976. Vivía en Soler 3693, Palermo. Su hermana, al participar en la confección de la baldosa, describió la experiencia: "Meter las manos en su nombre y en sus datos actuaron como un disparador. El afecto y el cariño de la gente no conocida hasta ese momento me rodeaba... Ahí descubrí que eso era la baldosa: había hecho renacer a mi hermano desaparecido." Baldosa colocada el 15 de junio de 2013, Soler 3693, Palermo.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ── 4 ──────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0008',
    nombre: 'Verónica Basco y Teresa Lajmanovich',
    descripcion: 'Dos jóvenes de 25 años que compartían departamento en Palermo. Teresa, a punto de recibirse de médica, fue secuestrada el 22 de marzo de 1977. Verónica fue asesinada el 16 de mayo de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4136, -34.5891],   // Arenales 3800, Palermo
    },
    direccion: 'Arenales 3800',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Basco+Lajmanovich',
    fotoUrl: '/images/fotos/BALD-0008.jpg',
    mensajeAR: 'VERÓNICA Y TERESA — Presentes',
    infoExtendida: 'Teresa Lajmanovich (desaparecida el 22 de marzo de 1977) tenía 25 años y estaba a punto de recibirse de médica. Fue secuestrada a las 4 de la mañana del departamento que compartía con Verónica en Arenales 3800. Verónica Basco Solari (1952–1977) cursaba 5to año de Medicina en la UBA, militaba en la Juventud Universitaria Peronista y realizaba su residencia en Hematología en el Hospital Ramos Mejía. Fue pareja de Guillermo Pagés Larraya, también desaparecido. Asesinada el 16 de mayo de 1977. Su cuerpo le fue entregado al padre con la condición de firmar que había muerto en un "enfrentamiento", declaración que pudo revocarse en democracia. Baldosa colocada el 5 de mayo de 2023, Arenales 3800, Palermo.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ── 5 ──────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0009',
    nombre: 'Daniel Jorge Bertoni',
    descripcion: 'Veterinario, militante popular, padre de cuatro hijos. Detenido y desaparecido a los 32 años el 2 de septiembre de 1977 en Scalabrini Ortiz y Cabrera.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4266, -34.5943],   // Scalabrini Ortiz 2360, Palermo
    },
    direccion: 'Scalabrini Ortiz 2360',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Daniel+Bertoni',
    fotoUrl: '/images/fotos/BALD-0009.jpg',
    mensajeAR: 'DANIEL BERTONI — Presente',
    infoExtendida: 'Daniel Jorge Bertoni Cabezudo fue veterinario, militante popular, casado y padre de cuatro hijos. Tenía 32 años cuando fue detenido y desaparecido el 2 de septiembre de 1977. Su hija, en el acto de colocación de la baldosa en 2019, le escribió: "Nos llevó mucho tiempo llegar a este día... Crecimos con sensación de incertidumbre. En casa no se hablaba de vos. Luego estudié psicología para tratar de entender. Quiero dejarte tranquilo: estamos bien, muy bien. Somos una hermosa familia. Sabemos que no nos abandonaste." Baldosa colocada el 5 de octubre de 2019, Scalabrini Ortiz 2360, Palermo.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ── 6 ──────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0010',
    nombre: 'Claudio Norberto Braverman',
    descripcion: 'Militante popular detenido y desaparecido el 30 de octubre de 1976. Vivía en el 8° piso del edificio de Sánchez de Bustamante 1742.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4098, -34.5923],   // Sánchez de Bustamante 1742, Palermo
    },
    direccion: 'Sánchez de Bustamante 1742',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Claudio+Braverman',
    fotoUrl: '/images/fotos/BALD-0010.jpg',
    mensajeAR: 'CLAUDIO BRAVERMAN — Presente',
    infoExtendida: 'Claudio Norberto Braverman Maltz vivía en el 8° piso del edificio de Sánchez de Bustamante 1742, Palermo. Fue detenido y desaparecido el 30 de octubre de 1976 a los 30 años de edad. Militante popular víctima del Terrorismo de Estado. Baldosa colocada el 5 de septiembre de 2023, repuesta el 2 de febrero de 2025 en Sánchez de Bustamante 1742, CABA.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ── 7 ──────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0011',
    nombre: 'Rolando Adem y Alberto Munarriz',
    descripcion: 'Militantes populares que vivían en Coronel Díaz 1717, Palermo. Detenidos y desaparecidos por el Terrorismo de Estado.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4074, -34.5890],   // Coronel Díaz 1717, Palermo
    },
    direccion: 'Coronel Díaz 1717',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Adem+Munarriz',
    fotoUrl: '/images/fotos/BALD-0011.jpg',
    mensajeAR: 'ROLANDO Y ALBERTO — Presentes',
    infoExtendida: 'Rolando Elías Adem y Alberto José Munarriz fueron militantes populares detenidos y desaparecidos por el Terrorismo de Estado. Vivían en Coronel Díaz 1717, Palermo. Baldosa colocada el 22 de marzo de 2013, repuesta el 10 de junio de 2017, Coronel Díaz 1717, Palermo, CABA.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ── 8 ──────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0012',
    nombre: 'Marisa Bordini',
    descripcion: 'Conocida como "la Tana". Militante popular detenida y desaparecida el 5 de agosto de 1977. Vivía en Guise 1657, Palermo.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4285, -34.5709],   // Guise 1657, Palermo
    },
    direccion: 'Guise 1657',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Marisa+Bordini',
    fotoUrl: '/images/fotos/BALD-0012.jpg',
    mensajeAR: 'MARISA BORDINI — Presente',
    infoExtendida: 'Marisa Bordini Ghilardi, apodada "la Tana", vivía en el 1° piso E del edificio de Guise 1657, Palermo. Fue detenida y desaparecida el 5 de agosto de 1977. Militante popular, víctima del Terrorismo de Estado. Baldosa colocada el 4 de diciembre de 2021, Guise 1657, Palermo, CABA.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ── 9 ──────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0013',
    nombre: 'Daniel Roveda Fino',
    descripcion: 'Militante popular detenido y desaparecido. Baldosa colocada el 12 de diciembre de 2021 en el Planetario de la Ciudad, Palermo.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4181, -34.5691],   // Planetario, Sarmiento y Figueroa Alcorta
    },
    direccion: 'Av. Sarmiento y Figueroa Alcorta — Planetario',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Daniel+Roveda+Fino',
    fotoUrl: '/images/fotos/BALD-0013.jpg',
    mensajeAR: 'DANIEL ROVEDA FINO — Presente',
    infoExtendida: 'Daniel Roveda Fino fue militante popular detenido y desaparecido por el Terrorismo de Estado. Su baldosa fue colocada el 12 de diciembre de 2021 en el Planetario de la Ciudad de Buenos Aires, Palermo, CABA, en un acto de memoria colectiva organizado por familiares y compañeros.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ── 10 ─────────────────────────────────────────────────────────────────────
  {
    codigo: 'BALD-0014',
    nombre: 'Nelly Ortiz y Guillermo Díaz Lestrem',
    descripcion: 'Guillermo, apodado "el Chino", y Nelly fueron dos militantes populares detenidos y desaparecidos. Baldosa colocada el 1° de diciembre de 2022 en Cerviño 3570.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4149, -34.5729],   // Cerviño 3570, Palermo
    },
    direccion: 'Cerviño 3570',
    barrio: 'Palermo',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Ortiz+Lestrem',
    fotoUrl: '/images/fotos/BALD-0014.jpg',
    mensajeAR: 'NELLY Y EL CHINO — Presentes',
    infoExtendida: 'Nelly E. Ortiz y Guillermo Raúl Díaz Lestrem, conocido como "el Chino", fueron militantes populares detenidos y desaparecidos por el Terrorismo de Estado. Guillermo fue detenido-desaparecido el 20 de octubre de 1978. Vivían en Cerviño 3570, Palermo. Baldosa colocada el 1° de diciembre de 2022, Cerviño 3570, CABA.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

]

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Iniciando seed (location-based)...\n')

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('✅ Conectado a MongoDB\n')

    const db = client.db()
    const col = db.collection('baldosas')

    // ── Verificar duplicados ─────────────────────────────────────────────────
    console.log('🔍 Verificando duplicados...')
    const codigos = baldosas.map(b => b.codigo)
    const existentes = await col.find({ codigo: { $in: codigos } }).toArray()
    const codigosExistentes = new Set(existentes.map(b => b.codigo))

    if (existentes.length > 0) {
      console.log('⚠️  Ya existen en la DB (se omitirán):')
      existentes.forEach(b => console.log(`   - ${b.codigo}: ${b.nombre}`))
      console.log()
    }

    const nuevas = baldosas.filter(b => !codigosExistentes.has(b.codigo))

    if (nuevas.length === 0) {
      console.log('ℹ️  No hay baldosas nuevas para agregar. Todo ya estaba cargado.\n')
      return
    }

    // ── Insertar ─────────────────────────────────────────────────────────────
    console.log(`🛤️  Insertando ${nuevas.length} baldosa(s)...`)
    const result = await col.insertMany(nuevas)
    console.log(`✅ ${Object.keys(result.insertedIds).length} baldosas insertadas\n`)
    console.log('📋 Insertadas:')
    nuevas.forEach(b => console.log(`   ${b.codigo}: ${b.nombre} (${b.direccion})`))

    // ── Índice geoespacial ────────────────────────────────────────────────────
    console.log('\n🗺️  Asegurando índice geoespacial...')
    await col.createIndex({ ubicacion: '2dsphere' })
    console.log('✅ Índice 2dsphere listo\n')

    // ── Resumen ───────────────────────────────────────────────────────────────
    const total = await col.countDocuments()
    console.log('🎉 Seed completado\n')
    console.log('📊 Resumen:')
    console.log(`   Total en DB    : ${total}`)
    console.log(`   Nuevas hoy     : ${nuevas.length}`)
    console.log(`   Omitidas (dup) : ${existentes.length}`)
    console.log()
    console.log('📸 Recordá tener las fotos en public/images/fotos/:')
    nuevas.forEach(b => console.log(`   ${b.fotoUrl}`))
    console.log()

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('👋 Desconectado de MongoDB\n')
  }
}

seed()
