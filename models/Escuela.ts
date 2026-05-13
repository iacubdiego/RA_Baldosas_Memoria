import mongoose from 'mongoose';
import type { Types } from 'mongoose';

export interface IEscuela {
  _id: Types.ObjectId;
  nombre: string;
  direccion: string;
  barrio: string;
  ubicacion: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  baldosas_ids: Types.ObjectId[];
  ruta_geojson: GeoJSON.LineString | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const escuelaSchema = new mongoose.Schema<IEscuela>(
  {
    nombre: {
      type: String,
      required: true,
    },
    direccion: {
      type: String,
      required: true,
    },
    barrio: {
      type: String,
      required: true,
    },
    ubicacion: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    baldosas_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Baldosa',
      default: [],
    },
    ruta_geojson: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

escuelaSchema.index({ ubicacion: '2dsphere' });
escuelaSchema.index({ activo: 1 });

export default mongoose.models.Escuela ||
  mongoose.model<IEscuela>('Escuela', escuelaSchema);
