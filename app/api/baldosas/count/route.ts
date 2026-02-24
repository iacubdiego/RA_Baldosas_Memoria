import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Baldosa from '@/models/Baldosa';

export const revalidate = 60; // cache 60 segundos

export async function GET() {
  try {
    await connectDB();
    const total = await Baldosa.countDocuments({ activo: true });
    return NextResponse.json({ total });
  } catch (error) {
    return NextResponse.json({ total: 0 });
  }
}
