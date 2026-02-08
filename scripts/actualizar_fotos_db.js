#!/usr/bin/env node

/**
 * Script para actualizar MongoDB con rutas de fotos
 * ==================================================
 * Lee las fotos en public/images/fotos/ y actualiza
 * cada baldosa con su campo fotoVictima
 * 
 * USO:
 * node actualizar_fotos_db.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'baldosas_db';
const FOTOS_DIR = path.join(__dirname, '..', 'public', 'images', 'fotos');

// ============================================
// FUNCIONES
// ============================================

async function conectar() {
  console.log('🔌 Conectando a MongoDB...');
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log('✅ Conectado a MongoDB\n');
  return { client, db };
}

function obtenerFotos() {
  console.log('📸 Buscando fotos en:', FOTOS_DIR);
  
  if (!fs.existsSync(FOTOS_DIR)) {
    console.log('⚠️  Directorio no existe, creándolo...');
    fs.mkdirSync(FOTOS_DIR, { recursive: true });
    return [];
  }
  
  const archivos = fs.readdirSync(FOTOS_DIR);
  const fotos = archivos.filter(f => 
    f.endsWith('.jpg') || 
    f.endsWith('.jpeg') || 
    f.endsWith('.png')
  );
  
  console.log(`✅ Encontradas ${fotos.length} fotos\n`);
  return fotos;
}

async function actualizarBaldosas(db, fotos) {
  console.log('💾 Actualizando baldosas...\n');
  
  let actualizadas = 0;
  let noEncontradas = 0;
  let errores = 0;
  
  for (const nombreFoto of fotos) {
    // Extraer código de la baldosa del nombre del archivo
    // Ejemplo: 001.jpg -> codigo = "001"
    const codigo = nombreFoto.replace(/\.(jpg|jpeg|png)$/i, '');
    const fotoPath = `/images/fotos/${nombreFoto}`;
    
    try {
      const resultado = await db.collection('baldosas').updateOne(
        { codigo: codigo },
        { $set: { fotoVictima: fotoPath } }
      );
      
      if (resultado.matchedCount > 0) {
        console.log(`✅ ${codigo.padEnd(10)} → ${fotoPath}`);
        actualizadas++;
      } else {
        console.log(`⚠️  ${codigo.padEnd(10)} → Baldosa no encontrada en DB`);
        noEncontradas++;
      }
      
    } catch (error) {
      console.log(`❌ ${codigo.padEnd(10)} → Error: ${error.message}`);
      errores++;
    }
  }
  
  return { actualizadas, noEncontradas, errores };
}

async function verificarBaldosasSinFoto(db) {
  console.log('\n📋 Verificando baldosas sin foto...\n');
  
  const baldosasSinFoto = await db.collection('baldosas').find({
    activo: true,
    $or: [
      { fotoVictima: { $exists: false } },
      { fotoVictima: null },
      { fotoVictima: '' }
    ]
  }).toArray();
  
  if (baldosasSinFoto.length > 0) {
    console.log(`⚠️  ${baldosasSinFoto.length} baldosas sin foto:\n`);
    baldosasSinFoto.forEach(b => {
      console.log(`   ${b.codigo || b._id.toString()}: ${b.nombre}`);
    });
    console.log('\n💡 Agregar fotos con el nombre del código: {codigo}.jpg');
  } else {
    console.log('✅ Todas las baldosas activas tienen foto asignada');
  }
  
  return baldosasSinFoto;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  ACTUALIZAR FOTOS EN BALDOSAS                     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  
  let client;
  
  try {
    // Conectar
    const { client: mongoClient, db } = await conectar();
    client = mongoClient;
    
    // Obtener fotos
    const fotos = obtenerFotos();
    
    if (fotos.length === 0) {
      console.log('⚠️  No hay fotos para procesar');
      console.log(`\n📋 Para usar este script:`);
      console.log(`1. Copiar fotos a: ${FOTOS_DIR}`);
      console.log(`2. Nombrar como: {codigo}.jpg`);
      console.log(`   Ejemplo: 001.jpg, 002.jpg, etc.`);
      console.log(`3. Ejecutar: node actualizar_fotos_db.js\n`);
      await client.close();
      return;
    }
    
    // Actualizar
    const stats = await actualizarBaldosas(db, fotos);
    
    // Verificar baldosas sin foto
    await verificarBaldosasSinFoto(db);
    
    // Resumen
    console.log('\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ PROCESO COMPLETADO');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Baldosas actualizadas: ${stats.actualizadas}`);
    console.log(`⚠️  Fotos sin baldosa: ${stats.noEncontradas}`);
    console.log(`❌ Errores: ${stats.errores}`);
    console.log('');
    
    if (stats.noEncontradas > 0) {
      console.log('💡 TIP: Las fotos sin baldosa asociada pueden ser:');
      console.log('   - Códigos incorrectos');
      console.log('   - Baldosas no creadas aún');
      console.log('   - Archivos de test');
    }
    
    console.log('');
    console.log('📋 PRÓXIMOS PASOS:');
    console.log('1. Verificar que el portaretrato genérico existe:');
    console.log('   public/models/portaretrato_generico.glb');
    console.log('2. Probar en el scanner:');
    console.log('   npm run dev → http://localhost:3000/scanner');
    console.log('');
    
    await client.close();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = { main };
