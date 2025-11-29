const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local');
  process.exit(1);
}

// Baldosas de ejemplo en diferentes zonas de Buenos Aires
const baldosasEjemplo = [
  {
    codigo: 'BALD-001',
    nombre: 'Jorge Luis Borges',
    descripcion: 'Escritor, poeta y ensayista argentino, considerado uno de los autores más destacados de la literatura del siglo XX.',
    categoria: 'artista',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3816, -34.6037] // Centro de Buenos Aires
    },
    direccion: 'Av. Corrientes 1500',
    barrio: 'San Nicolás',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Jorge+Luis+Borges',
    mensajeAR: '📚 JORGE LUIS BORGES\nEscritor y poeta',
    infoExtendida: 'Jorge Francisco Isidoro Luis Borges (Buenos Aires, 24 de agosto de 1899 - Ginebra, 14 de junio de 1986) fue un escritor, poeta, ensayista y traductor argentino, extensamente considerado una figura clave tanto para la literatura en habla hispana como para la literatura universal.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-002',
    nombre: 'Mercedes Sosa',
    descripcion: 'Cantante folklórica argentina, conocida como "La voz de América Latina".',
    categoria: 'artista',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3826, -34.6047]
    },
    direccion: 'Av. de Mayo 1100',
    barrio: 'Monserrat',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Mercedes+Sosa',
    mensajeAR: '🎤 MERCEDES SOSA\nLa voz de América Latina',
    infoExtendida: 'Haydée Mercedes Sosa, conocida simplemente como Mercedes Sosa (San Miguel de Tucumán, 9 de julio de 1935 - Buenos Aires, 4 de octubre de 2009), fue una cantante de música folklórica argentina, considerada la mayor exponente del folklore argentino.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-003',
    nombre: 'Carlos Gardel',
    descripcion: 'Cantante, compositor y actor de cine, el más conocido representante del género en la historia del tango.',
    categoria: 'artista',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3850, -34.6020]
    },
    direccion: 'Calle Corrientes 800',
    barrio: 'San Nicolás',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Carlos+Gardel',
    mensajeAR: '🎵 CARLOS GARDEL\nEl rey del tango',
    infoExtendida: 'Carlos Gardel (11 de diciembre de 1890 - 24 de junio de 1935) fue un cantante, compositor y actor de cine nacionalizado argentino. Es el más conocido representante del género en la historia del tango.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-004',
    nombre: 'Julio Cortázar',
    descripcion: 'Escritor, traductor e intelectual argentino, uno de los autores más innovadores del siglo XX.',
    categoria: 'artista',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3800, -34.6050]
    },
    direccion: 'Av. Belgrano 1200',
    barrio: 'Monserrat',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Julio+Cortazar',
    mensajeAR: '✍️ JULIO CORTÁZAR\nEscritor y poeta',
    infoExtendida: 'Julio Florencio Cortázar (Ixelles, 26 de agosto de 1914 - París, 12 de febrero de 1984) fue un escritor, traductor e intelectual argentino de ascendencia francesa, considerado uno de los autores más innovadores y originales de su tiempo.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    codigo: 'BALD-005',
    nombre: 'Ernesto Sabato',
    descripcion: 'Escritor, ensayista, físico y pintor argentino.',
    categoria: 'artista',
    ubicacion: {
      type: 'Point',
      coordinates: [-58.3830, -34.6060]
    },
    direccion: 'Av. de Mayo 900',
    barrio: 'Monserrat',
    imagenUrl: 'https://via.placeholder.com/400x300?text=Ernesto+Sabato',
    mensajeAR: '📖 ERNESTO SÁBATO\nEscritor y ensayista',
    infoExtendida: 'Ernesto Sábato (Rojas, 24 de junio de 1911 - Santos Lugares, 30 de abril de 2011) fue un escritor, ensayista, físico y pintor argentino. Autor de novelas como El túnel, Sobre héroes y tumbas y Abaddón el exterminador.',
    vecesEscaneada: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Cluster de ejemplo para estas baldosas
const clusterEjemplo = {
  codigo: 'CLUSTER-001',
  centro: {
    type: 'Point',
    coordinates: [-58.3816, -34.6037]
  },
  radio: 200,
  barrio: 'Centro',
  mindFileUrl: null, // Por ahora null, se llenará cuando se compile
  version: 1,
  baldosasCount: 5,
  maxBaldosas: 10,
  necesitaRecompilacion: true,
  ultimaCompilacion: null,
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
    console.log(`   • Ubicación: Centro de Buenos Aires\n`);
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Desconectado de MongoDB');
  }
}

seed();
