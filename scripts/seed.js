const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local');
  process.exit(1);
}

// Baldosas sobre víctimas de la última dictadura militar argentina (1976-1983)
const baldosasEjemplo = [
  {
    codigo: 'BALD-001',
    nombre: 'Azucena Villaflor',
    descripcion: 'Fundadora de Madres de Plaza de Mayo. Secuestrada y desaparecida el 10 de diciembre de 1977.',
    categoria: 'historico',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3816, -34.6037] // Plaza de Mayo
    },
    direccion: 'Plaza de Mayo',
    barrio: 'Monserrat',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Azucena+Villaflor',
    mensajeAR: '🕊️ AZUCENA VILLAFLOR\nMadre de Plaza de Mayo',
    infoExtendida: 'Azucena Villaflor de De Vincenti (La Plata, 7 de abril de 1924 - desaparecida el 10 de diciembre de 1977) fue una de las fundadoras de la Asociación Madres de Plaza de Mayo. Secuestrada en una iglesia junto a otras madres y monjas francesas. Sus restos fueron identificados en 2005.',
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
      coordinates: [-58.3826, -34.6047]
    },
    direccion: 'Av. Entre Ríos y San Juan',
    barrio: 'San Cristóbal',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Rodolfo+Walsh',
    mensajeAR: '✍️ RODOLFO WALSH\nEscritor y periodista',
    infoExtendida: 'Rodolfo Jorge Walsh (Choele Choel, 9 de enero de 1927 - desaparecido el 25 de marzo de 1977) fue un escritor, periodista y traductor argentino. Un día después de enviar su "Carta Abierta de un Escritor a la Junta Militar", fue emboscado y desaparecido por un grupo de tareas de la ESMA.',
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
      coordinates: [-58.3800, -34.6050]
    },
    direccion: 'Diagonal Norte 600',
    barrio: 'San Nicolás',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Nora+Cortiñas',
    mensajeAR: '🤍 NORA CORTIÑAS\nMadre de Plaza de Mayo',
    infoExtendida: 'Nora Cortiñas (Buenos Aires, 20 de agosto de 1930) es una activista argentina de derechos humanos, integrante de Madres de Plaza de Mayo Línea Fundadora. Su hijo Gustavo fue secuestrado y desaparecido el 15 de abril de 1977 a los 24 años. Desde entonces lucha incansablemente por Memoria, Verdad y Justicia.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Cluster único para las 3 baldosas
const clusterEjemplo = {
  codigo: 'CLUSTER-001',
  centro: {
    type: 'Point',
    coordinates: [-58.3816, -34.6037] // Plaza de Mayo
  },
  radio: 200,
  barrio: 'Centro Histórico',
  mindFileUrl: '/storage/clusters/cluster-001.mind', // Un solo archivo .mind fijo
  version: 1,
  baldosasCount: 3,
  maxBaldosas: 10,
  necesitaRecompilacion: false, // Ya está compilado
  ultimaCompilacion: new Date(),
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('baldosas_db');
    
    // Limpiar colecciones existentes (opcional)
    const baldosasCollection = db.collection('baldosas');
    const clustersCollection = db.collection('clusters');
    
    console.log('🗑️  Limpiando colecciones existentes...');
    await baldosasCollection.deleteMany({});
    await clustersCollection.deleteMany({});
    console.log('✅ Colecciones limpiadas\n');
    
    // Insertar cluster
    console.log('📦 Insertando cluster...');
    const clusterResult = await clustersCollection.insertOne(clusterEjemplo);
    console.log(`✅ Cluster insertado: ${clusterResult.insertedId}\n`);
    
    // Asignar cluster a baldosas
    const baldosasConCluster = baldosasEjemplo.map(baldosa => ({
      ...baldosa,
      clusterId: clusterResult.insertedId.toString(),
      targetIndex: baldosasEjemplo.indexOf(baldosa)
    }));
    
    // Insertar baldosas
    console.log('🏛️  Insertando baldosas...');
    const baldosasResult = await baldosasCollection.insertMany(baldosasConCluster);
    console.log(`✅ ${Object.keys(baldosasResult.insertedIds).length} baldosas insertadas\n`);
    
    // Crear índices geoespaciales
    console.log('🗺️  Creando índices geoespaciales...');
    await baldosasCollection.createIndex({ ubicacion: '2dsphere' });
    await clustersCollection.createIndex({ centro: '2dsphere' });
    console.log('✅ Índices creados\n');
    
    console.log('🎉 ¡Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   • Baldosas: ${Object.keys(baldosasResult.insertedIds).length}`);
    console.log(`   • Clusters: 1`);
    console.log(`   • Tema: Víctimas de la última dictadura militar (1976-1983)`);
    console.log(`   • Ubicación: Centro Histórico de Buenos Aires\n`);
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Desconectado de MongoDB');
  }
}

seed();
