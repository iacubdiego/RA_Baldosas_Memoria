import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import Propuesta from '@/models/Propuesta';
import Baldosa from '@/models/Baldosa';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Parsear form data (incluye archivo .mind)
    const formData = await request.formData();
    
    const codigo = formData.get('codigo') as string;
    const categoria = formData.get('categoria') as string;
    const barrio = formData.get('barrio') as string | null;
    const mensajeAR = formData.get('mensajeAR') as string;
    const infoExtendida = formData.get('infoExtendida') as string | null;
    const mindFile = formData.get('mindFile') as File | null;

    // Validaciones
    if (!codigo || codigo.trim().length < 4) {
      return NextResponse.json(
        { error: 'Código inválido (mínimo 4 caracteres)' },
        { status: 400 }
      );
    }

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoría es requerida' },
        { status: 400 }
      );
    }

    if (!mensajeAR || mensajeAR.trim().length < 5) {
      return NextResponse.json(
        { error: 'Mensaje AR inválido (mínimo 5 caracteres)' },
        { status: 400 }
      );
    }

    if (!mindFile) {
      return NextResponse.json(
        { error: 'Archivo .mind es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el archivo sea .mind
    if (!mindFile.name.endsWith('.mind')) {
      return NextResponse.json(
        { error: 'El archivo debe ser .mind' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar que la propuesta existe y está aprobada
    const propuesta = await Propuesta.findById(id);
    
    if (!propuesta) {
      return NextResponse.json(
        { error: 'Propuesta no encontrada' },
        { status: 404 }
      );
    }

    if (propuesta.estado !== 'aprobada') {
      return NextResponse.json(
        { error: 'La propuesta debe estar aprobada primero' },
        { status: 400 }
      );
    }

    // Verificar que no exista código duplicado
    const existeCodigo = await Baldosa.findOne({ codigo });
    if (existeCodigo) {
      return NextResponse.json(
        { error: `Ya existe una baldosa con el código ${codigo}` },
        { status: 400 }
      );
    }

    // Extraer coordenadas
    const [lng, lat] = propuesta.ubicacion.coordinates;

    // 1. Guardar imagen de la propuesta
    let imagenPath = null;
    if (propuesta.imagenBase64) {
      try {
        const imageDir = path.join(process.cwd(), 'public', 'images', 'baldosas');
        await mkdir(imageDir, { recursive: true });

        const base64Data = propuesta.imagenBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        imagenPath = `/images/baldosas/${codigo}.jpg`;
        const filePath = path.join(process.cwd(), 'public', imagenPath);
        
        await writeFile(filePath, buffer);
        console.log(`✅ Imagen guardada: ${imagenPath}`);
      } catch (error) {
        console.error('Error guardando imagen:', error);
        // No es crítico, continuar sin imagen
      }
    }

    // 2. Guardar archivo .mind
    const mindFileName = `${codigo.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mind`;
    const mindDir = path.join(process.cwd(), 'public', 'targets');
    await mkdir(mindDir, { recursive: true });

    const mindBuffer = Buffer.from(await mindFile.arrayBuffer());
    const mindPath = path.join(mindDir, mindFileName);
    
    await writeFile(mindPath, mindBuffer);
    console.log(`✅ Archivo .mind guardado: /targets/${mindFileName}`);

    // 3. Crear baldosa en MongoDB
    const nuevaBaldosa = new Baldosa({
      codigo: codigo.trim(),
      nombre: propuesta.nombrePersona,
      descripcion: propuesta.descripcion,
      categoria,
      ubicacion: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      direccion: propuesta.direccion || undefined,
      barrio: barrio?.trim() || undefined,
      imagenUrl: imagenPath || `https://via.placeholder.com/400x300?text=${encodeURIComponent(propuesta.nombrePersona)}`,
      mindFileUrl: `/targets/${mindFileName}`,
      targetIndex: 0,
      mensajeAR: mensajeAR.trim(),
      infoExtendida: infoExtendida?.trim() || propuesta.descripcion,
      vecesEscaneada: 0,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await nuevaBaldosa.save();
    console.log(`✅ Baldosa creada: ${codigo} (${nuevaBaldosa._id})`);

    // 4. Marcar propuesta como procesada
    await Propuesta.findByIdAndUpdate(
      id,
      {
        $set: {
          notas: `Procesada → Baldosa ${codigo} (${nuevaBaldosa._id.toString()})`,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Baldosa ${codigo} creada exitosamente`,
      baldosa: {
        id: nuevaBaldosa._id.toString(),
        codigo,
        nombre: nuevaBaldosa.nombre,
        mindFileUrl: nuevaBaldosa.mindFileUrl,
        imagenUrl: nuevaBaldosa.imagenUrl
      }
    });

  } catch (error) {
    console.error('Error en /api/propuestas/[id]/convertir:', error);
    return NextResponse.json(
      { 
        error: 'Error al convertir propuesta',
        detail: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
