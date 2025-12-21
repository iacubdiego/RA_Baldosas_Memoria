import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Baldosa from '@/models/Baldosa';
import Cluster from '@/models/Cluster';
import { isValidCoordinates } from '@/lib/geo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseInt(searchParams.get('radius') || '500');

    if (!lat || !lng || !isValidCoordinates(lat, lng)) {
      return NextResponse.json(
        { error: 'Coordenadas inválidas' },
        { status: 400 }
      );
    }

    if (radius < 1 || radius > 10000) {
      return NextResponse.json(
        { error: 'Radio debe estar entre 1 y 10000 metros' },
        { status: 400 }
      );
    }

    await connectDB();

    const baldosas = await Baldosa.find({
      activo: true,
      ubicacion: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      },
    }).limit(50);

    const clusters = await Cluster.find({
      activo: true,
      centro: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radius * 2,
        },
      },
    }).limit(10);

    const baldosasWithDistance = baldosas.map(baldosa => {
      const [bLng, bLat] = baldosa.ubicacion.coordinates;
      const R = 6371e3;
      const φ1 = (lat * Math.PI) / 180;
      const φ2 = (bLat * Math.PI) / 180;
      const Δφ = ((bLat - lat) * Math.PI) / 180;
      const Δλ = ((bLng - lng) * Math.PI) / 180;
      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return {
        id: baldosa._id.toString(),
        codigo: baldosa.codigo,
        nombre: baldosa.nombre,
        categoria: baldosa.categoria,
        lat: bLat,
        lng: bLng,
        direccion: baldosa.direccion,
        barrio: baldosa.barrio,
        mensajeAR: baldosa.mensajeAR,
        imagenUrl: baldosa.imagenUrl,
        clusterId: baldosa.clusterId,
        targetIndex: baldosa.targetIndex,
        distancia: Math.round(distance),
      };
    });

    const clusterMap = new Map();
    clusters.forEach(cluster => {
      const [cLng, cLat] = cluster.centro.coordinates;
      clusterMap.set(cluster._id.toString(), {
        id: cluster._id.toString(),
        codigo: cluster.codigo,
        mindFileUrl: cluster.mindFileUrl,
        lat: cLat,
        lng: cLng,
        baldosasCount: cluster.baldosasCount,
        version: cluster.version,
      });
    });

    return NextResponse.json({
      baldosas: baldosasWithDistance,
      clusters: Array.from(clusterMap.values()),
      total: baldosasWithDistance.length,
      userLocation: { lat, lng },
      radius,
    });
  } catch (error) {
    console.error('Error en /api/baldosas/nearby:', error);
    return NextResponse.json(
      { error: 'Error al buscar baldosas' },
      { status: 500 }
    );
  }
}
