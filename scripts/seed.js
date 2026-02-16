const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local');
  process.exit(1);
}

// Lista de baldosas para cargar
const baldosasEjemplo = [
  // {
  //   codigo: 'BALD-0001',
  //   nombre: 'Azucena Villaflor',
  //   descripcion: 'Fundadora de Madres de Plaza de Mayo. Secuestrada y desaparecida el 10 de diciembre de 1977.',
  //   categoria: 'historico',
  //   ubicacion: {
  //     type: 'Point',
  //     coordinates: [-58.4731, -34.5757]  // [lng, lat] - Plaza de Mayo
  //   },
  //   direccion: 'Plaza de Mayo',
  //   barrio: 'Monserrat',
  //   imagenUrl: 'https://via.placeholder.com/400x300?text=Azucena+Villaflor',
  //   fotoUrl: '/images/fotos/BALD-0001.jpg',
  //   mindFileUrl: '/targets/BALD-0001.mind',
  //   targetIndex: 0,
  //   mensajeAR: 'AZUCENA VILLAFLOR - Presente',
  //   infoExtendida: 'Azucena Villaflor de De Vincenti fue una de las fundadoras de la Asociación Madres de Plaza de Mayo. Sus restos fueron identificados en 2005.',
  //   vecesEscaneada: 0,
  //   activo: true,
  //   createdAt: new Date(),
  //   updatedAt: new Date()
  // },
  {
    codigo: 'BALD-0005',
    nombre: 'Azucena Villaflor',
    descripcion: 'Fundadora de Madres de Plaza de Mayo. Secuestrada el 10 de diciembre de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3725, -34.6037]  // Plaza de Mayo
    },
    direccion: 'Plaza de Mayo',
    barrio: 'Monserrat',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Azucena+Villaflor',
    fotoUrl: '/images/fotos/BALD-0005.jpg',
    mindFileUrl: '/targets/BALD-0005.mind',
    targetIndex: 0,
    mensajeAR: 'AZUCENA VILLAFLOR - Presente',
    infoExtendida: 'Azucena Villaflor de De Vincenti (1924-1977) fue una de las fundadoras de Madres de Plaza de Mayo. Propuso reunirse en Plaza de Mayo el 30 de abril de 1977. Secuestrada por la ESMA, fue arrojada viva al mar. Sus restos fueron identificados en 2005.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0006',
    nombre: 'Rodolfo Walsh',
    descripcion: 'Escritor y periodista. Autor de "Carta Abierta de un Escritor a la Junta Militar". Desaparecido el 25 de marzo de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3905, -34.6177]
    },
    direccion: 'Av. San Juan y Entre Ríos',
    barrio: 'San Cristóbal',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Rodolfo+Walsh',
    fotoUrl: '/images/fotos/BALD-0006.jpg',
    mindFileUrl: '/targets/BALD-0006.mind',
    targetIndex: 0,
    mensajeAR: 'RODOLFO WALSH - Presente',
    infoExtendida: 'Rodolfo Jorge Walsh (1927-1977) fue escritor, periodista y militante de Montoneros. Un día después de difundir su Carta Abierta a la Junta Militar fue emboscado y asesinado por un grupo de tareas de la ESMA. Su cuerpo permanece desaparecido.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0007',
    nombre: 'Esther Ballestrino',
    descripcion: 'Bioquímica y fundadora de Madres de Plaza de Mayo. Desaparecida el 8 de diciembre de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3817, -34.6183]
    },
    direccion: 'Iglesia Santa Cruz, Av. Brasil y Tacuarí',
    barrio: 'San Cristóbal',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Esther+Ballestrino',
    fotoUrl: '/images/fotos/BALD-0007.jpg',
    mindFileUrl: '/targets/BALD-0007.mind',
    targetIndex: 0,
    mensajeAR: 'ESTHER BALLESTRINO - Presente',
    infoExtendida: 'Esther Ballestrino de Careaga fue bioquímica y una de las fundadoras de Madres de Plaza de Mayo. Secuestrada junto a otras madres en la Iglesia Santa Cruz por el infiltrado Alfredo Astiz. Arrojada viva al mar, sus restos fueron identificados en 2005.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0008',
    nombre: 'María Eugenia Ponce',
    descripcion: 'Fundadora de Madres de Plaza de Mayo. Desaparecida el 8 de diciembre de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3817, -34.6183]
    },
    direccion: 'Iglesia Santa Cruz, Av. Brasil y Tacuarí',
    barrio: 'San Cristóbal',
    imagenUrl: 'https://via.placeholder.com/400x300?text=María+Ponce',
    fotoUrl: '/images/fotos/BALD-0008.jpg',
    mindFileUrl: '/targets/BALD-0008.mind',
    targetIndex: 0,
    mensajeAR: 'MARÍA EUGENIA PONCE - Presente',
    infoExtendida: 'María Eugenia Ponce de Bianco fue una de las fundadoras de Madres de Plaza de Mayo. Participó desde la primera marcha del 30 de abril de 1977. Secuestrada junto a Esther Ballestrino, fue arrojada al mar. Sus restos fueron identificados en 2005.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0009',
    nombre: 'Alice Domon y Léonie Duquet',
    descripcion: 'Monjas francesas que colaboraban con Madres de Plaza de Mayo. Desaparecidas en diciembre de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3817, -34.6183]
    },
    direccion: 'Iglesia Santa Cruz, Av. Brasil y Tacuarí',
    barrio: 'San Cristóbal',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Monjas+Francesas',
    fotoUrl: '/images/fotos/BALD-0009.jpg',
    mindFileUrl: '/targets/BALD-0009.mind',
    targetIndex: 0,
    mensajeAR: 'ALICE DOMON Y LÉONIE DUQUET - Presentes',
    infoExtendida: 'Alice Domon y Léonie Duquet eran monjas francesas que colaboraban activamente con las Madres de Plaza de Mayo en la búsqueda de desaparecidos. Secuestradas en diciembre de 1977 por Alfredo Astiz, fueron arrojadas vivas al mar.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0010',
    nombre: 'Trabajadores de ENCOTEL',
    descripcion: '31 trabajadores de la Empresa Nacional de Correos y Telégrafos desaparecidos durante la dictadura.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3708, -34.6033]
    },
    direccion: 'Centro Cultural Kirchner, Sarmiento 151',
    barrio: 'San Nicolás',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Trabajadores+ENCOTEL',
    fotoUrl: '/images/fotos/BALD-0010.jpg',
    mindFileUrl: '/targets/BALD-0010.mind',
    targetIndex: 0,
    mensajeAR: 'TRABAJADORES DE ENCOTEL - Presentes',
    infoExtendida: '31 trabajadores del Correo Argentino fueron desaparecidos durante la dictadura militar. Eran trabajadores sindicalizados perseguidos por el terrorismo de Estado. En 2022 se colocaron baldosas en su honor en el Centro Cultural Kirchner.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0011',
    nombre: 'Obreros Navales de ASTARSA',
    descripcion: '19 obreros navales de Astilleros ASTARSA desaparecidos. Zona Norte, Gran Buenos Aires.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.5321, -34.4678]
    },
    direccion: 'Ex Astilleros ASTARSA, Zona Norte',
    barrio: 'Zona Norte',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Obreros+ASTARSA',
    fotoUrl: '/images/fotos/BALD-0011.jpg',
    mindFileUrl: '/targets/BALD-0011.mind',
    targetIndex: 0,
    mensajeAR: 'OBREROS NAVALES DE ASTARSA - Presentes',
    infoExtendida: '19 obreros navales de Astilleros ASTARSA fueron desaparecidos durante la dictadura militar. Trabajadores del cordón industrial de la Zona Norte del Gran Buenos Aires, fueron víctimas de la represión al movimiento obrero organizado.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0012',
    nombre: 'Trabajadores Ceramistas',
    descripcion: 'Trabajadores de Cerámicas Cattaneo y Lozadur desaparecidos. Zona Norte, Gran Buenos Aires.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.5234, -34.4589]
    },
    direccion: 'Cerámicas Cattaneo y Lozadur, Zona Norte',
    barrio: 'Zona Norte',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Ceramistas',
    fotoUrl: '/images/fotos/BALD-0012.jpg',
    mindFileUrl: '/targets/BALD-0012.mind',
    targetIndex: 0,
    mensajeAR: 'TRABAJADORES CERAMISTAS - Presentes',
    infoExtendida: 'Trabajadores de las fábricas de cerámica Cattaneo y Lozadur fueron desaparecidos durante la dictadura. Obreros sindicalizados de la Zona Norte del Gran Buenos Aires, víctimas de la represión al movimiento obrero. Baldosas colocadas en 2010-2011.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0013',
    nombre: 'Estudiantes del Colegio Nacional',
    descripcion: 'Estudiantes y ex-alumnos del Colegio Nacional de Buenos Aires desaparecidos durante la dictadura.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3725, -34.6095]
    },
    direccion: 'Colegio Nacional de Buenos Aires, Bolívar 263',
    barrio: 'Monserrat',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Estudiantes+CNBA',
    fotoUrl: '/images/fotos/BALD-0013.jpg',
    mindFileUrl: '/targets/BALD-0013.mind',
    targetIndex: 0,
    mensajeAR: 'ESTUDIANTES DEL NACIONAL - Presentes',
    infoExtendida: 'Múltiples estudiantes y ex-alumnos del Colegio Nacional de Buenos Aires fueron desaparecidos durante la dictadura militar. Jóvenes militantes estudiantiles víctimas del terrorismo de Estado. La comunidad educativa realizó las baldosas colectivamente.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0014',
    nombre: 'Estudiantes Carlos Pellegrini',
    descripcion: 'Estudiantes y ex-alumnos de la Escuela de Comercio Carlos Pellegrini desaparecidos durante la dictadura.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3936, -34.6037]
    },
    direccion: 'Escuela Carlos Pellegrini, Marcelo T. de Alvear 1851',
    barrio: 'Recoleta',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Estudiantes+Pellegrini',
    fotoUrl: '/images/fotos/BALD-0014.jpg',
    mindFileUrl: '/targets/BALD-0014.mind',
    targetIndex: 0,
    mensajeAR: 'ESTUDIANTES DEL PELLEGRINI - Presentes',
    infoExtendida: 'Estudiantes y ex-alumnos de la Escuela de Comercio Nº 1 Carlos Pellegrini fueron desaparecidos durante la dictadura. Jóvenes con militancia estudiantil y política, víctimas del terrorismo de Estado. La comunidad educativa participó en la elaboración de las baldosas.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const baldosasCollection = db.collection('baldosas');
    
    // Opción: Limpiar colección (comentar si querés mantener datos existentes)
    const limpiar = true;  // Cambiar a false para no borrar baldosas existentes
    
    if (limpiar) {
      console.log('🗑️  Limpiando colección de baldosas...');
      await baldosasCollection.deleteMany({});
      console.log('✅ Colección limpiada\n');
    } else {
      console.log('⚠️  Modo agregar: No se borrarán baldosas existentes\n');
    }
    
    // Verificar duplicados
    console.log('🔍 Verificando duplicados...');
    const codigos = baldosasEjemplo.map(b => b.codigo);
    const existentes = await baldosasCollection.find({ 
      codigo: { $in: codigos } 
    }).toArray();
    
    if (existentes.length > 0 && !limpiar) {
      console.log('⚠️  Baldosas duplicadas encontradas:');
      existentes.forEach(b => {
        console.log(`   - ${b.codigo}: ${b.nombre}`);
      });
      console.log('\nℹ️  Se omitirán las baldosas duplicadas\n');
      
      // Filtrar duplicados
      const codigosExistentes = existentes.map(b => b.codigo);
      const baldosasNuevas = baldosasEjemplo.filter(
        b => !codigosExistentes.includes(b.codigo)
      );
      
      if (baldosasNuevas.length === 0) {
        console.log('ℹ️  No hay baldosas nuevas para agregar');
      } else {
        console.log('🛤️  Insertando baldosas nuevas...');
        const result = await baldosasCollection.insertMany(baldosasNuevas);
        console.log(`✅ ${Object.keys(result.insertedIds).length} baldosas insertadas\n`);
        
        console.log('📋 Baldosas agregadas:');
        Object.entries(result.insertedIds).forEach(([index, id]) => {
          console.log(`   ${baldosasNuevas[index].codigo}: ${baldosasNuevas[index].nombre}`);
        });
      }
    } else {
      console.log('🛤️  Insertando baldosas...');
      const result = await baldosasCollection.insertMany(baldosasEjemplo);
      console.log(`✅ ${Object.keys(result.insertedIds).length} baldosas insertadas\n`);
      
      console.log('📋 IDs de baldosas creadas:');
      Object.entries(result.insertedIds).forEach(([index, id]) => {
        console.log(`   ${baldosasEjemplo[index].codigo}: ${baldosasEjemplo[index].nombre}`);
      });
    }
    
    console.log('\n🗺️  Creando índice geoespacial...');
    await baldosasCollection.createIndex({ ubicacion: '2dsphere' });
    console.log('✅ Índice creado\n');
    
    // Contar total
    const total = await baldosasCollection.countDocuments();
    
    console.log('🎉 ¡Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   • Total de baldosas en DB: ${total}`);
    console.log(`   • Tema: Víctimas de la última dictadura militar (1976-1983)`);
    console.log('\n⚠️  ARCHIVOS NECESARIOS:');
    console.log('');
    console.log('📸 Fotos (public/images/fotos/):');
    baldosasEjemplo.forEach(b => {
      console.log(`   • ${b.fotoUrl}`);
    });
    console.log('');
    console.log('🎯 Archivos .mind (public/targets/):');
    baldosasEjemplo.forEach(b => {
      console.log(`   • ${b.mindFileUrl}`);
    });
    console.log('');
    console.log('💡 Generar .mind en: https://hiukim.github.io/mind-ar-js-doc/tools/compile');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Desconectado de MongoDB\n');
  }
}

seed();
