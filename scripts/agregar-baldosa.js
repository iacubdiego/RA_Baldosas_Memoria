#!/usr/bin/env node

/**
 * AGREGAR BALDOSA - Script Automatizado
 * ======================================
 * 
 * Asume que los archivos ya están en:
 * - public/targets/*.mind
 * - public/images/fotos/*.jpg
 * 
 * Solo pide datos y guarda en MongoDB
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'baldosas_db';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  AGREGAR NUEVA BALDOSA                       ║');
  console.log('║  Recorremos Memoria                          ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  
  const projectRoot = process.cwd();
  const targetsDir = path.join(projectRoot, 'public', 'targets');
  const fotosDir = path.join(projectRoot, 'public', 'images', 'fotos');
  
  try {
    // ==========================================
    // 1. VERIFICAR DIRECTORIOS
    // ==========================================
    
    if (!fs.existsSync(targetsDir)) {
      fs.mkdirSync(targetsDir, { recursive: true });
    }
    
    if (!fs.existsSync(fotosDir)) {
      fs.mkdirSync(fotosDir, { recursive: true });
    }
    
    // ==========================================
    // 2. PEDIR NOMBRES DE ARCHIVOS
    // ==========================================
    
    console.log('📁 ARCHIVOS NECESARIOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Los archivos deben estar en:');
    console.log('  • public/targets/');
    console.log('  • public/images/fotos/');
    console.log('');
    console.log('Formato: BALD-0001.mind y BALD-0001.jpg (4 dígitos)');
    console.log('');
    
    const mindFileName = await pregunta('Nombre del archivo .mind (ej: BALD-0005.mind): ');
    const mindFilePath = path.join(targetsDir, mindFileName);
    
    if (!fs.existsSync(mindFilePath)) {
      throw new Error(`Archivo no encontrado: ${mindFilePath}\nVerificá que esté en public/targets/`);
    }
    
    console.log(`   ✅ .mind encontrado: ${mindFileName}`);
    
    const fotoFileName = await pregunta('Nombre del archivo de foto (ej: BALD-0005.jpg): ');
    const fotoFilePath = path.join(fotosDir, fotoFileName);
    
    if (!fs.existsSync(fotoFilePath)) {
      throw new Error(`Archivo no encontrado: ${fotoFilePath}\nVerificá que esté en public/images/fotos/`);
    }
    
    console.log(`   ✅ Foto encontrada: ${fotoFileName}`);
    console.log('');
    
    const mindFileUrl = `/targets/${mindFileName}`;
    const fotoUrl = `/images/fotos/${fotoFileName}`;
    
    
    // ==========================================
    // 3. DATOS DE LA BALDOSA
    // ==========================================
    
    console.log('📝 DATOS DE LA BALDOSA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    const codigo = await pregunta('Código (ej: BALD-0005): ');
    if (!codigo || codigo.length < 9) {
      throw new Error('Código inválido. Formato: BALD-0001 (4 dígitos)');
    }
    
    const nombre = await pregunta('Nombre completo: ');
    if (!nombre) {
      throw new Error('Nombre requerido');
    }
    
    const descripcion = await pregunta('Descripción breve: ');
    const infoExtendida = await pregunta('Descripción extendida (Enter para usar la breve): ');
    
    const lat = parseFloat(await pregunta('Latitud (ej: -34.608): '));
    const lng = parseFloat(await pregunta('Longitud (ej: -58.373): '));
    
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Coordenadas inválidas');
    }
    
    const direccion = await pregunta('Dirección: ');
    const barrio = await pregunta('Barrio (opcional): ');
    
    // ==========================================
    // 4. CONFIRMAR
    // ==========================================
    
    console.log('');
    console.log('📋 RESUMEN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Código: ${codigo}`);
    console.log(`Nombre: ${nombre}`);
    console.log(`Ubicación: ${lat}, ${lng}`);
    console.log(`Dirección: ${direccion}`);
    console.log('');
    console.log('Archivos:');
    console.log(`  .mind: ${mindFileUrl}`);
    console.log(`  Foto: ${fotoUrl}`);
    console.log('');
    
    const confirmar = await pregunta('¿Guardar en MongoDB? (s/n): ');
    if (confirmar.toLowerCase() !== 's') {
      console.log('Cancelado');
      rl.close();
      return;
    }
    
    // ==========================================
    // 5. GUARDAR EN MONGODB
    // ==========================================
    
    console.log('');
    console.log('💾 GUARDANDO EN MONGODB:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('   🔌 Conectado');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('baldosas');
    
    // Verificar duplicado
    const existe = await collection.findOne({ codigo });
    if (existe) {
      await client.close();
      throw new Error(`Ya existe una baldosa con código ${codigo}`);
    }
    
    const nuevaBaldosa = {
      codigo,
      nombre,
      descripcion: descripcion || `${nombre} - Víctima de la dictadura`,
      categoria: 'historico',
      ubicacion: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      direccion,
      barrio: barrio || null,
      imagenUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(nombre)}`,
      fotoUrl,
      mindFileUrl,
      targetIndex: 0,
      mensajeAR: `${nombre.toUpperCase()} - Presente`,
      infoExtendida: infoExtendida || descripcion,
      vecesEscaneada: 0,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const resultado = await collection.insertOne(nuevaBaldosa);
    console.log(`   ✅ Guardada (ID: ${resultado.insertedId})`);
    
    await client.close();
    
    // ==========================================
    // 6. LISTO
    // ==========================================
    
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  ✅ BALDOSA CREADA EXITOSAMENTE             ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    console.log('📦 Archivos usados:');
    console.log(`   • ${mindFileUrl}`);
    console.log(`   • ${fotoUrl}`);
    console.log('');
    console.log('💾 MongoDB:');
    console.log(`   • Código: ${codigo}`);
    console.log(`   • ID: ${resultado.insertedId}`);
    console.log('');
    console.log('🧪 Probar:');
    console.log(`   http://localhost:3000/scanner?id=${codigo}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    rl.close();
  }
}

main();
