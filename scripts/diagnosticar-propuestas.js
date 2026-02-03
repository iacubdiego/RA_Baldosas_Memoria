const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local');
  process.exit(1);
}

async function diagnosticar() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  DIAGNÓSTICO DE PROPUESTAS                  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  try {
    console.log('🔌 Conectando a MongoDB...');
    console.log(`   URI: ${MONGODB_URI.substring(0, 30)}...`);
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    const db = client.db();
    console.log(`📊 Base de datos: ${db.databaseName}\n`);

    // Ver colecciones disponibles
    console.log('📁 Colecciones en la base de datos:');
    console.log('═══════════════════════════════════════════════');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   • ${col.name}`);
    });
    console.log('');

    // Verificar si existe la colección propuestas
    const propuestasCollection = db.collection('propuestas');
    
    console.log('📊 ANÁLISIS DE PROPUESTAS:');
    console.log('═══════════════════════════════════════════════\n');

    // Contar total
    const total = await propuestasCollection.countDocuments();
    console.log(`Total de propuestas: ${total}`);

    if (total === 0) {
      console.log('\n⚠️  No hay propuestas en la base de datos');
      console.log('   Para crear una propuesta de prueba:');
      console.log('   1. Ir a http://localhost:3000/colaborar');
      console.log('   2. Llenar el formulario');
      console.log('   3. Enviar propuesta');
      console.log('   4. Ir a http://localhost:3000/admin');
      console.log('   5. Aprobar la propuesta');
      console.log('');
      await client.close();
      return;
    }

    // Contar por estado
    console.log('\nPropuestas por estado:');
    const estados = await propuestasCollection.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    if (estados.length === 0) {
      console.log('   ⚠️  Hay propuestas pero sin campo "estado"');
    } else {
      estados.forEach(e => {
        console.log(`   • ${e._id || '(sin estado)'}: ${e.count}`);
      });
    }

    // Mostrar todas las propuestas con detalles
    console.log('\n📋 LISTA COMPLETA DE PROPUESTAS:');
    console.log('═══════════════════════════════════════════════\n');

    const todasPropuestas = await propuestasCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    if (todasPropuestas.length === 0) {
      console.log('   (vacío)\n');
    } else {
      todasPropuestas.forEach((prop, index) => {
        const [lng, lat] = prop.ubicacion?.coordinates || [0, 0];
        console.log(`${index + 1}. ${prop.nombrePersona || '(sin nombre)'}`);
        console.log(`   ID: ${prop._id}`);
        console.log(`   Estado: ${prop.estado || '(sin estado)'}`);
        console.log(`   Ubicación: ${lat}, ${lng}`);
        console.log(`   Dirección: ${prop.direccion || '(sin dirección)'}`);
        console.log(`   Tiene imagen: ${prop.imagenBase64 ? 'Sí' : 'No'}`);
        console.log(`   Email: ${prop.emailContacto || '(sin email)'}`);
        console.log(`   Fecha: ${prop.createdAt ? prop.createdAt.toLocaleDateString('es-AR') : '(sin fecha)'}`);
        console.log(`   Notas: ${prop.notas || '(sin notas)'}`);
        console.log('');
      });
    }

    // Verificar específicamente las aprobadas
    console.log('🔍 PROPUESTAS CON ESTADO "aprobada":');
    console.log('═══════════════════════════════════════════════\n');

    const aprobadas = await propuestasCollection
      .find({ estado: 'aprobada' })
      .toArray();

    if (aprobadas.length === 0) {
      console.log('   ❌ No hay propuestas con estado "aprobada"\n');
      
      // Verificar si hay con otros estados similares
      console.log('🔍 Buscando estados similares...\n');
      const conEstado = await propuestasCollection
        .find({ estado: { $exists: true } })
        .toArray();
      
      if (conEstado.length > 0) {
        const estadosUnicos = [...new Set(conEstado.map(p => p.estado))];
        console.log('   Estados encontrados:');
        estadosUnicos.forEach(e => {
          console.log(`   • "${e}"`);
        });
        console.log('');
      }
    } else {
      console.log(`   ✅ Encontradas ${aprobadas.length} propuesta(s) aprobada(s):\n`);
      aprobadas.forEach((prop, index) => {
        console.log(`   ${index + 1}. ${prop.nombrePersona}`);
        console.log(`      ID: ${prop._id}`);
        console.log(`      Notas: ${prop.notas || '(sin notas)'}`);
        console.log('');
      });
    }

    // Sugerencias
    console.log('💡 SUGERENCIAS:');
    console.log('═══════════════════════════════════════════════\n');

    if (total === 0) {
      console.log('1. Crear una propuesta desde /colaborar');
      console.log('2. Aprobarla desde /admin');
      console.log('3. Ejecutar este diagnóstico de nuevo');
    } else if (aprobadas.length === 0) {
      const pendientes = await propuestasCollection.countDocuments({ estado: 'pendiente' });
      if (pendientes > 0) {
        console.log(`1. Hay ${pendientes} propuesta(s) pendiente(s)`);
        console.log('2. Ir a http://localhost:3000/admin');
        console.log('3. Aprobar una propuesta');
        console.log('4. Ejecutar: node scripts/propuesta-a-baldosa.js');
      } else {
        console.log('1. Verificar el valor del campo "estado" en MongoDB');
        console.log('2. Debe ser exactamente "aprobada" (minúsculas)');
        console.log('3. Usar el panel /admin para aprobar propuestas');
      }
    } else {
      console.log('✅ Todo parece estar en orden');
      console.log('   Podés ejecutar: node scripts/propuesta-a-baldosa.js');
    }

    console.log('');

    // Verificar también baldosas
    console.log('📊 ANÁLISIS DE BALDOSAS:');
    console.log('═══════════════════════════════════════════════\n');

    const baldosasCollection = db.collection('baldosas');
    const totalBaldosas = await baldosasCollection.countDocuments();
    
    console.log(`Total de baldosas: ${totalBaldosas}\n`);

    if (totalBaldosas > 0) {
      const baldosas = await baldosasCollection.find({}).limit(5).toArray();
      console.log('Últimas 5 baldosas:');
      baldosas.forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.codigo} - ${b.nombre}`);
      });
      console.log('');
    }

    await client.close();
    console.log('👋 Desconectado de MongoDB');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetalles técnicos:');
    console.error(error);
    process.exit(1);
  }
}

diagnosticar();
