const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local');
  process.exit(1);
}

// IMPORTANTE: Actualizar estas coordenadas con las ubicaciones reales de las baldosas
const baldosasEjemplo = [
  {
    codigo: 'BALD-001',
    nombre: 'Azucena Villaflor',
    descripcion: 'Fundadora de Madres de Plaza de Mayo. Secuestrada y desaparecida el 10 de diciembre de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3816, -34.6037]  // [lng, lat] - Plaza de Mayo
    },
    direccion: 'Plaza de Mayo',
    barrio: 'Monserrat',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Azucena+Villaflor',
    mindFileUrl: '/targets/baldosa-001.mind',
    mensajeAR: 'Madre de Plaza de Mayo - 1924-1977',
    infoExtendida: 'Azucena Villaflor de De Vincenti fue una de las fundadoras de la Asociación Madres de Plaza de Mayo. Sus restos fueron identificados en 2005.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-002',
    nombre: 'Rodolfo Walsh',
    descripcion: 'Escritor y periodista. Autor de "Carta Abierta de un Escritor a la Junta Militar". Desaparecido el 25 de marzo de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.9826, -34.8047]  // [lng, lat] - Actualizar con ubicación real
    },
    direccion: 'Av. Entre Ríos y San Juan',
    barrio: 'San Cristóbal',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Rodolfo+Walsh',
    mindFileUrl: '/targets/baldosa-002.mind',
    mensajeAR: 'Escritor y periodista - 1927-1977',
    infoExtendida: 'Rodolfo Jorge Walsh fue un escritor, periodista y traductor argentino. Un día después de enviar su "Carta Abierta" fue emboscado y desaparecido.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-003',
    nombre: 'Nora Cortiñas',
    descripcion: 'Madre de Plaza de Mayo - Línea Fundadora. Su hijo Gustavo fue secuestrado el 15 de abril de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-34.581091, -58.480708]  // [lng, lat] - Actualizar con ubicación real
    },
    direccion: 'Diagonal Norte 600',
    barrio: 'San Nicolás',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Nora+Cortiñas',
    mindFileUrl: '/targets/baldosa-003.mind',
    mensajeAR: 'Madre de Plaza de Mayo - Línea Fundadora',
    infoExtendida: 'Nora Cortiñas fue una activista argentina de derechos humanos. Su hijo Gustavo fue secuestrado y desaparecido el 15 de abril de 1977.',
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
    
    const db = client.db();  // Usa la DB especificada en la URI
    
    const baldosasCollection = db.collection('baldosas');
    
    console.log('🗑️  Limpiando colección de baldosas...');
    await baldosasCollection.deleteMany({});
    console.log('✅ Colección limpiada\n');
    
    console.log('🏛️  Insertando baldosas...');
    const baldosasResult = await baldosasCollection.insertMany(baldosasEjemplo);
    console.log(`✅ ${Object.keys(baldosasResult.insertedIds).length} baldosas insertadas\n`);
    
    // Mostrar IDs para referencia
    console.log('📝 IDs de baldosas creadas:');
    Object.entries(baldosasResult.insertedIds).forEach(([index, id]) => {
      console.log(`   ${baldosasEjemplo[index].codigo}: ${id}`);
    });
    
    console.log('\n🗺️  Creando índice geoespacial...');
    await baldosasCollection.createIndex({ ubicacion: '2dsphere' });
    console.log('✅ Índice creado\n');
    
    console.log('🎉 ¡Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   • Baldosas: ${Object.keys(baldosasResult.insertedIds).length}`);
    console.log(`   • Tema: Víctimas de la última dictadura militar (1976-1983)`);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   Para que el escaneo funcione, necesitás crear los archivos .mind:');
    console.log('   • /targets/baldosa-001.mind');
    console.log('   • /targets/baldosa-002.mind');
    console.log('   • /targets/baldosa-003.mind');
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

seed();
