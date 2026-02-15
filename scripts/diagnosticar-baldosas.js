#!/usr/bin/env node

/**
 * DIAGNÓSTICO DE BALDOSAS
 * ========================
 * Verifica la carga de baldosas y detecta problemas
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'baldosas_db';

async function diagnosticar() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  DIAGNÓSTICO DE BALDOSAS                    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // ==========================================
    // 1. VERIFICAR CONEXIÓN
    // ==========================================
    
    console.log('🔌 VERIFICANDO CONEXIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!MONGO_URI) {
      console.error('❌ MONGODB_URI no está definida en .env.local');
      process.exit(1);
    }
    
    console.log('✅ MONGODB_URI encontrada');
    console.log('');
    
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    console.log('');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('baldosas');
    
    // ==========================================
    // 2. CONTAR BALDOSAS
    // ==========================================
    
    console.log('📊 CONTEO DE BALDOSAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const total = await collection.countDocuments();
    console.log(`Total de baldosas: ${total}`);
    console.log('');
    
    if (total === 0) {
      console.log('⚠️  No hay baldosas en la base de datos');
      console.log('');
      console.log('Ejecutá: node scripts/seed.js');
      await client.close();
      return;
    }
    
    // ==========================================
    // 3. LISTAR BALDOSAS
    // ==========================================
    
    console.log('📋 BALDOSAS EN BASE DE DATOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    const baldosas = await collection.find({}).toArray();
    
    baldosas.forEach((b, i) => {
      console.log(`${i + 1}. ${b.codigo} - ${b.nombre}`);
      console.log(`   _id: ${b._id}`);
      console.log(`   fotoUrl: ${b.fotoUrl || '❌ NO DEFINIDO'}`);
      console.log(`   mindFileUrl: ${b.mindFileUrl || '❌ NO DEFINIDO'}`);
      console.log(`   ubicacion: ${b.ubicacion ? '✅' : '❌'}`);
      console.log(`   activo: ${b.activo}`);
      console.log('');
    });
    
    // ==========================================
    // 4. VERIFICAR ARCHIVOS
    // ==========================================
    
    console.log('📁 VERIFICACIÓN DE ARCHIVOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    const projectRoot = process.cwd();
    const targetsDir = path.join(projectRoot, 'public', 'targets');
    const fotosDir = path.join(projectRoot, 'public', 'images', 'fotos');
    
    console.log('📸 Fotos en public/images/fotos/:');
    if (!fs.existsSync(fotosDir)) {
      console.log('   ❌ Carpeta no existe');
    } else {
      const fotos = fs.readdirSync(fotosDir).filter(f => f.endsWith('.jpg'));
      if (fotos.length === 0) {
        console.log('   ⚠️  No hay archivos .jpg');
      } else {
        fotos.forEach(f => console.log(`   ✅ ${f}`));
      }
    }
    console.log('');
    
    console.log('🎯 Targets en public/targets/:');
    if (!fs.existsSync(targetsDir)) {
      console.log('   ❌ Carpeta no existe');
    } else {
      const targets = fs.readdirSync(targetsDir).filter(f => f.endsWith('.mind'));
      if (targets.length === 0) {
        console.log('   ⚠️  No hay archivos .mind');
      } else {
        targets.forEach(f => console.log(`   ✅ ${f}`));
      }
    }
    console.log('');
    
    // ==========================================
    // 5. CRUZAR DATOS
    // ==========================================
    
    console.log('🔍 VALIDACIÓN CRUZADA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    let errores = 0;
    
    for (const baldosa of baldosas) {
      console.log(`Verificando ${baldosa.codigo}:`);
      
      // Verificar fotoUrl
      if (!baldosa.fotoUrl) {
        console.log(`   ❌ fotoUrl no definido`);
        errores++;
      } else {
        const fotoPath = path.join(projectRoot, 'public', baldosa.fotoUrl);
        if (fs.existsSync(fotoPath)) {
          console.log(`   ✅ Foto existe: ${baldosa.fotoUrl}`);
        } else {
          console.log(`   ❌ Foto NO existe: ${baldosa.fotoUrl}`);
          errores++;
        }
      }
      
      // Verificar mindFileUrl
      if (!baldosa.mindFileUrl) {
        console.log(`   ❌ mindFileUrl no definido`);
        errores++;
      } else {
        const mindPath = path.join(projectRoot, 'public', baldosa.mindFileUrl);
        if (fs.existsSync(mindPath)) {
          console.log(`   ✅ Target existe: ${baldosa.mindFileUrl}`);
        } else {
          console.log(`   ❌ Target NO existe: ${baldosa.mindFileUrl}`);
          errores++;
        }
      }
      
      // Verificar ubicación
      if (!baldosa.ubicacion || !baldosa.ubicacion.coordinates) {
        console.log(`   ❌ Ubicación no definida`);
        errores++;
      } else {
        const [lng, lat] = baldosa.ubicacion.coordinates;
        console.log(`   ✅ Ubicación: ${lat}, ${lng}`);
      }
      
      console.log('');
    }
    
    // ==========================================
    // 6. RESUMEN
    // ==========================================
    
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  RESUMEN                                    ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    console.log(`Total de baldosas: ${total}`);
    console.log(`Errores encontrados: ${errores}`);
    console.log('');
    
    if (errores === 0) {
      console.log('✅ TODO ESTÁ BIEN - Las baldosas deberían cargar correctamente');
    } else {
      console.log('⚠️  HAY PROBLEMAS - Ver errores arriba');
      console.log('');
      console.log('💡 Soluciones:');
      console.log('   1. Ejecutar: node scripts/seed.js (recarga baldosas)');
      console.log('   2. Verificar que los archivos existan en public/');
      console.log('   3. Verificar formato de nombres: BALD-0001.jpg y BALD-0001.mind');
    }
    console.log('');
    
    // ==========================================
    // 7. PROBAR API
    // ==========================================
    
    console.log('🌐 PRUEBA DE API:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Para probar en el navegador:');
    console.log('');
    baldosas.slice(0, 3).forEach(b => {
      console.log(`http://localhost:3000/api/baldosas/${b.codigo}`);
    });
    console.log('');
    console.log('http://localhost:3000/scanner');
    console.log('');
    
    await client.close();
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
  }
}

diagnosticar();
