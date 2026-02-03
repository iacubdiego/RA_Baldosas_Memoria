const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en .env.local');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  CONVERTIR PROPUESTA A BALDOSA              ║');
  console.log('║  Baldosas por la Memoria                    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('Este script convierte una propuesta aprobada en baldosa.');
  console.log('');

  try {
    // Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado\n');

    const db = client.db();
    const propuestasCollection = db.collection('propuestas');
    const baldosasCollection = db.collection('baldosas');

    // Listar propuestas aprobadas
    console.log('📋 PROPUESTAS APROBADAS:');
    console.log('═══════════════════════════════════════════════');
    
    const propuestasAprobadas = await propuestasCollection
      .find({ estado: 'aprobada' })
      .sort({ createdAt: -1 })
      .toArray();

    if (propuestasAprobadas.length === 0) {
      console.log('❌ No hay propuestas aprobadas pendientes de procesar');
      await client.close();
      rl.close();
      return;
    }

    propuestasAprobadas.forEach((prop, index) => {
      const [lng, lat] = prop.ubicacion.coordinates;
      console.log(`\n${index + 1}. ${prop.nombrePersona}`);
      console.log(`   Ubicación: ${lat}, ${lng}`);
      console.log(`   Dirección: ${prop.direccion || 'No especificada'}`);
      console.log(`   Fecha: ${prop.createdAt.toLocaleDateString('es-AR')}`);
      console.log(`   ID: ${prop._id}`);
    });

    console.log('\n═══════════════════════════════════════════════\n');

    // Seleccionar propuesta
    const seleccion = await pregunta('Seleccionar propuesta (número): ');
    const index = parseInt(seleccion) - 1;

    if (index < 0 || index >= propuestasAprobadas.length) {
      throw new Error('Selección inválida');
    }

    const propuesta = propuestasAprobadas[index];
    const [lng, lat] = propuesta.ubicacion.coordinates;

    // Mostrar datos de la propuesta
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  DATOS DE LA PROPUESTA                      ║');
    console.log('╚══════════════════════════════════════════════╝\n');
    console.log(`Persona: ${propuesta.nombrePersona}`);
    console.log(`Descripción: ${propuesta.descripcion}`);
    console.log(`Ubicación: ${lat}, ${lng}`);
    console.log(`Dirección: ${propuesta.direccion || 'No especificada'}`);
    console.log(`Email: ${propuesta.emailContacto || 'No especificado'}`);
    console.log(`Tiene imagen: ${propuesta.imagenBase64 ? 'Sí' : 'No'}`);
    console.log('');

    // Pedir datos adicionales necesarios
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  DATOS ADICIONALES PARA LA BALDOSA          ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    const codigo = await pregunta('Código único (ej: BALD-NNN): ');
    if (!codigo || codigo.trim().length < 4) {
      throw new Error('Código inválido');
    }

    // Verificar que no exista
    const existeCodigo = await baldosasCollection.findOne({ codigo });
    if (existeCodigo) {
      throw new Error(`Ya existe una baldosa con el código ${codigo}`);
    }

    console.log('\n📂 CATEGORÍA:');
    console.log('   Opciones: historico, artista, politico, deportista, cultural, otro');
    const categoria = await pregunta('Categoría [historico]: ') || 'historico';

    const barrio = await pregunta('Barrio (opcional): ');

    const mensajeAR = await pregunta('Mensaje AR (ej: "Desaparecido 1977 - Nunca Más"): ');
    if (!mensajeAR || mensajeAR.trim().length < 5) {
      throw new Error('Mensaje AR inválido');
    }

    const infoExtendida = await pregunta('Información extendida (opcional - Enter para usar descripción): ');

    // Información sobre el archivo .mind
    console.log('\n🎯 ARCHIVO .MIND:');
    console.log('   Pasos para compilar:');
    console.log('   1. Guardar la imagen de la propuesta como archivo');
    console.log('   2. cd public/targets');
    console.log('   3. npx mind-ar-cli -i ../../imagen.jpg');
    console.log('   4. mv targets.mind baldosa-NNN.mind');
    console.log('');

    const mindFileName = await pregunta('Nombre del archivo .mind (ej: baldosa-005.mind): ');
    if (!mindFileName || !mindFileName.endsWith('.mind')) {
      throw new Error('Nombre de archivo .mind inválido');
    }

    // Resumen
    console.log('\n══════════════════════════════════════════════');
    console.log('RESUMEN DE LA BALDOSA:');
    console.log('══════════════════════════════════════════════');
    console.log(`Código: ${codigo}`);
    console.log(`Nombre: ${propuesta.nombrePersona}`);
    console.log(`Descripción: ${propuesta.descripcion}`);
    console.log(`Ubicación: ${lat}, ${lng}`);
    console.log(`Dirección: ${propuesta.direccion || '(sin dirección)'}`);
    console.log(`Barrio: ${barrio || '(sin barrio)'}`);
    console.log(`Categoría: ${categoria}`);
    console.log(`Mensaje AR: ${mensajeAR}`);
    console.log(`Archivo .mind: ${mindFileName}`);
    console.log(`Info extendida: ${infoExtendida || propuesta.descripcion}`);
    console.log('══════════════════════════════════════════════\n');

    const confirmar = await pregunta('¿Crear baldosa? (s/n): ');
    if (confirmar.toLowerCase() !== 's') {
      console.log('❌ Operación cancelada');
      await client.close();
      rl.close();
      return;
    }

    // Crear la baldosa
    const nuevaBaldosa = {
      codigo,
      nombre: propuesta.nombrePersona,
      descripcion: propuesta.descripcion,
      categoria,
      ubicacion: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      direccion: propuesta.direccion || undefined,
      barrio: barrio || undefined,
      imagenUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(propuesta.nombrePersona)}`,
      mindFileUrl: `/targets/${mindFileName}`,
      targetIndex: 0,
      mensajeAR,
      infoExtendida: infoExtendida || propuesta.descripcion,
      vecesEscaneada: 0,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('\n💾 Guardando baldosa...');
    const result = await baldosasCollection.insertOne(nuevaBaldosa);
    console.log(`✅ Baldosa creada con ID: ${result.insertedId}`);

    // Actualizar la propuesta para marcarla como procesada
    await propuestasCollection.updateOne(
      { _id: propuesta._id },
      { 
        $set: { 
          notas: `Procesada → Baldosa ${codigo} (${result.insertedId})`,
          updatedAt: new Date()
        } 
      }
    );
    console.log('✅ Propuesta marcada como procesada');

    // Guardar imagen si existe
    if (propuesta.imagenBase64) {
      console.log('\n📷 IMAGEN DE LA PROPUESTA:');
      console.log('   La propuesta incluye una imagen en base64');
      
      const guardarImagen = await pregunta('¿Guardar imagen como archivo? (s/n): ');
      
      if (guardarImagen.toLowerCase() === 's') {
        try {
          // Extraer el base64 puro
          const base64Data = propuesta.imagenBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Crear directorio si no existe
          const imageDir = path.join(process.cwd(), 'temp', 'propuestas-imagenes');
          if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
          }
          
          // Guardar imagen
          const imagePath = path.join(imageDir, `${codigo}.jpg`);
          fs.writeFileSync(imagePath, buffer);
          
          console.log(`   ✅ Imagen guardada en: ${imagePath}`);
          console.log('   Podés usarla para compilar el .mind:');
          console.log(`   cd public/targets`);
          console.log(`   npx mind-ar-cli -i ../../temp/propuestas-imagenes/${codigo}.jpg`);
          console.log(`   mv targets.mind ${mindFileName}`);
        } catch (error) {
          console.error(`   ❌ Error guardando imagen: ${error.message}`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ PROCESO COMPLETADO');
    console.log('═══════════════════════════════════════════════\n');

    console.log('📋 PRÓXIMOS PASOS:');
    console.log('');
    console.log('1. 🎯 Compilar el archivo .mind:');
    console.log('   cd public/targets');
    if (propuesta.imagenBase64) {
      console.log(`   npx mind-ar-cli -i ../../temp/propuestas-imagenes/${codigo}.jpg`);
    } else {
      console.log('   npx mind-ar-cli -i ../../ruta-a-imagen.jpg');
    }
    console.log(`   mv targets.mind ${mindFileName}`);
    console.log('');
    console.log('2. 🧪 Probar con modo de prueba:');
    console.log('   npm run dev');
    console.log('   http://localhost:3000/scanner.html?test=true');
    console.log('');
    console.log('3. 📍 Verificar en ubicación real:');
    console.log('   http://localhost:3000/scanner.html');
    console.log('');
    console.log('4. ✉️  Opcional: Notificar al colaborador');
    if (propuesta.emailContacto) {
      console.log(`   Email: ${propuesta.emailContacto}`);
    }
    console.log('');

    await client.close();
    rl.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
