const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local');
  process.exit(1);
}

async function verificarTodo() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  VERIFICACIÓN COMPLETA DE MONGODB           ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  try {
    console.log('🔌 Conectando a MongoDB...');
    console.log(`Connection string: ${MONGODB_URI.substring(0, 50)}...`);
    console.log('');
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // Listar TODAS las bases de datos
    console.log('📊 BASES DE DATOS DISPONIBLES:');
    console.log('═══════════════════════════════════════════════');
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    databases.forEach(db => {
      console.log(`   • ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('');

    // Base de datos por defecto (la que se extrae del connection string)
    const defaultDb = client.db();
    console.log(`🎯 BASE DE DATOS POR DEFECTO: "${defaultDb.databaseName}"`);
    console.log('   (Esta es la que usan los scripts)\n');

    // Ver contenido de cada DB relevante
    for (const dbInfo of databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local' || dbInfo.name === 'config') {
        continue; // Saltar DBs del sistema
      }

      console.log(`\n╔══════════════════════════════════════════════╗`);
      console.log(`║  BASE DE DATOS: ${dbInfo.name.padEnd(30)} ║`);
      console.log(`╚══════════════════════════════════════════════╝\n`);

      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();

      console.log('📁 Colecciones:');
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   • ${col.name}: ${count} documento(s)`);
      }

      // Si tiene colección propuestas, mostrar detalles
      if (collections.some(c => c.name === 'propuestas')) {
        console.log('\n📋 PROPUESTAS en esta DB:');
        const propuestas = await db.collection('propuestas').find({}).toArray();
        
        if (propuestas.length === 0) {
          console.log('   (vacío)');
        } else {
          // Contar por estado
          const estados = {};
          propuestas.forEach(p => {
            const estado = p.estado || '(sin estado)';
            estados[estado] = (estados[estado] || 0) + 1;
          });

          console.log('   Por estado:');
          Object.entries(estados).forEach(([estado, count]) => {
            console.log(`      • ${estado}: ${count}`);
          });

          console.log('\n   Detalles:');
          propuestas.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.nombrePersona || '(sin nombre)'}`);
            console.log(`      Estado: "${p.estado}"`);
            console.log(`      ID: ${p._id}`);
          });
        }
      }

      // Si tiene colección baldosas, mostrar detalles
      if (collections.some(c => c.name === 'baldosas')) {
        console.log('\n🏛️  BALDOSAS en esta DB:');
        const baldosas = await db.collection('baldosas').find({}).limit(5).toArray();
        
        if (baldosas.length === 0) {
          console.log('   (vacío)');
        } else {
          const total = await db.collection('baldosas').countDocuments();
          console.log(`   Total: ${total}`);
          console.log('   Últimas 5:');
          baldosas.forEach((b, i) => {
            console.log(`      ${i + 1}. ${b.codigo} - ${b.nombre}`);
          });
        }
      }
    }

    console.log('\n\n╔══════════════════════════════════════════════╗');
    console.log('║  ANÁLISIS DEL PROBLEMA                      ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Analizar el problema
    let propuestasEncontradas = 0;
    let dbConPropuestas = null;

    for (const dbInfo of databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local' || dbInfo.name === 'config') {
        continue;
      }
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      if (collections.some(c => c.name === 'propuestas')) {
        const count = await db.collection('propuestas').countDocuments();
        if (count > 0) {
          propuestasEncontradas = count;
          dbConPropuestas = dbInfo.name;
        }
      }
    }

    if (propuestasEncontradas === 0) {
      console.log('❌ No se encontraron propuestas en ninguna base de datos');
      console.log('\n💡 Posible causa:');
      console.log('   • Las propuestas no se están guardando correctamente');
      console.log('   • Verificar que el formulario /colaborar funcione');
    } else if (dbConPropuestas !== defaultDb.databaseName) {
      console.log(`⚠️  PROBLEMA IDENTIFICADO:`);
      console.log(`   • Los scripts usan la DB: "${defaultDb.databaseName}"`);
      console.log(`   • Pero las propuestas están en: "${dbConPropuestas}"`);
      console.log(`   • Total de propuestas encontradas: ${propuestasEncontradas}`);
      console.log('');
      console.log('🔧 SOLUCIÓN:');
      console.log(`   1. Modificar MONGODB_URI en .env.local para usar "${dbConPropuestas}"`);
      console.log('   2. O crear un script que use la DB correcta');
      console.log('');
      console.log('   Connection string debería terminar en:');
      console.log(`   ...mongodb.net/${dbConPropuestas}?retryWrites=true&w=majority`);
    } else {
      console.log('✅ Las propuestas están en la DB correcta');
      console.log(`   DB: "${defaultDb.databaseName}"`);
      console.log(`   Propuestas: ${propuestasEncontradas}`);
    }

    console.log('');
    await client.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verificarTodo();
