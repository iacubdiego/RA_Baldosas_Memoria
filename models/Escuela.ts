import mongoose from 'mongoose';
import type { Types } from 'mongoose';

export interface IEscuela {
  _id: Types.ObjectId;
  nombre: string;
  direccion: string;
  barrio: string;
  comuna?: number;
  ubicacion: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  /** Texto crudo del nivel tal como viene del padrón GCBA. Puede contener
   *  varios separados por " | " (ej. "Nivel primario común | Nivel secundario común"). */
  nivel?: string;
  /** Categoría derivada: 'primario' | 'secundario' | 'primario_y_secundario' | 'otro'. */
  categoria?: 'primario' | 'secundario' | 'primario_y_secundario' | 'otro';
  /** Clave única de establecimiento (identificador nacional). */
  cue?: number;
  /** Tipo de establecimiento según GCBA (Colegios, Escuelas Técnicas, etc.). */
  tipo?: string;
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
    comuna: {
      type: Number,
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
    nivel: {
      type: String,
    },
    categoria: {
      type: String,
      enum: ['primario', 'secundario', 'primario_y_secundario', 'otro'],
    },
    cue: {
      type: Number,
    },
    tipo: {
      type: String,
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
escuelaSchema.index({ categoria: 1 });

export default mongoose.models.Escuela ||
  mongoose.model<IEscuela>('Escuela', escuelaSchema);
