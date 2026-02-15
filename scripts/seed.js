const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local');
  process.exit(1);
}

// Lista de baldosas para cargar
const baldosasEjemplo = [
  {
    codigo: 'BALD-0001',
    nombre: 'Azucena Villaflor',
    descripcion: 'Fundadora de Madres de Plaza de Mayo. Secuestrada y desaparecida el 10 de diciembre de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4731, -34.5757]  // [lng, lat] - Plaza de Mayo
    },
    direccion: 'Plaza de Mayo',
    barrio: 'Monserrat',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Azucena+Villaflor',
    fotoUrl: '/images/fotos/BALD-0001.jpg',
    mindFileUrl: '/targets/BALD-0001.mind',
    targetIndex: 0,
    mensajeAR: 'AZUCENA VILLAFLOR - Presente',
    infoExtendida: 'Azucena Villaflor de De Vincenti fue una de las fundadoras de la Asociación Madres de Plaza de Mayo. Sus restos fueron identificados en 2005.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0002',
    nombre: 'Rodolfo Walsh',
    descripcion: 'Escritor y periodista. Autor de "Carta Abierta de un Escritor a la Junta Militar". Desaparecido el 25 de marzo de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4621, -34.5667]  // [lng, lat]
    },
    direccion: 'Av. Entre Ríos y San Juan',
    barrio: 'San Cristóbal',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Rodolfo+Walsh',
    fotoUrl: '/images/fotos/BALD-0002.jpg',
    mindFileUrl: '/targets/BALD-0002.mind',
    targetIndex: 0,
    mensajeAR: 'RODOLFO WALSH - Presente',
    infoExtendida: 'Rodolfo Jorge Walsh fue un escritor, periodista y traductor argentino. Un día después de enviar su "Carta Abierta" fue emboscado y desaparecido.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0003',
    nombre: 'Nora Cortiñas',
    descripcion: 'Madre de Plaza de Mayo - Línea Fundadora. Su hijo Gustavo fue secuestrado el 15 de abril de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.480708, -34.581091]  // [lng, lat]
    },
    direccion: 'Diagonal Norte 600',
    barrio: 'San Nicolás',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Nora+Cortiñas',
    fotoUrl: '/images/fotos/BALD-0003.jpg',
    mindFileUrl: '/targets/BALD-0003.mind',
    targetIndex: 0,
    mensajeAR: 'NORA CORTIÑAS - Presente',
    infoExtendida: 'Nora Cortiñas fue una activista argentina de derechos humanos. Su hijo Gustavo fue secuestrado y desaparecido el 15 de abril de 1977.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-0004',
    nombre: 'Hernán Abriata',
    descripcion: 'Estudiante de arquitectura. Militaba en la JUP de la Facultad de Arquitectura. Fue secuestrado en su vivienda de Elcano 3265.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.4597, -34.5732]  // [lng, lat]
    },
    direccion: 'Av. Elcano 3235',
    barrio: 'Colegiales',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Hernán+Abriata',
    fotoUrl: '/images/fotos/BALD-0004.jpg',
    mindFileUrl: '/targets/BALD-0004.mind',
    targetIndex: 0,
    mensajeAR: 'HERNÁN ABRIATA - Presente',
    infoExtendida: 'Hernán era estudiante de arquitectura, se había casado hacía pocos meses con Mónica. Militaba en la JUP de la Facultad de Arquitectura. Tenía 4 hermanas menores.',
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
