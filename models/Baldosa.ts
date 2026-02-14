import mongoose from 'mongoose';

export interface IBaldosa {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  ubicacion: {
    type: 'Point';
    coordinates: [number, number];
  };
  direccion?: string;
  barrio?: string;
  imagenUrl?: string;      // Imagen para cards/listados
  fotoUrl?: string;         // NUEVO: Foto para el portaretrato AR
  audioUrl?: string;
  mindFileUrl?: string;
  clusterId?: string;
  targetIndex?: number;
  mensajeAR: string;
  infoExtendida?: string;
  vecesEscaneada: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const baldosaSchema = new mongoose.Schema<IBaldosa>({
  codigo: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  nombre: { 
    type: String, 
    required: true 
  },
  descripcion: String,
  categoria: { 
    type: String, 
    required: true,
    enum: ['artista', 'politico', 'historico', 'deportista', 'cultural', 'otro']
  },
  ubicacion: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  direccion: String,
  barrio: String,
  imagenUrl: String,       // Imagen para cards/listados
  fotoUrl: String,         // NUEVO: Foto para portaretrato AR
  audioUrl: String,
  mindFileUrl: String,
  clusterId: String,
  targetIndex: Number,
  mensajeAR: { 
    type: String, 
    required: true 
  },
  infoExtendida: String,
  vecesEscaneada: { 
    type: Number, 
    default: 0 
  },
  activo: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

baldosaSchema.index({ ubicacion: '2dsphere' });
baldosaSchema.index({ activo: 1, clusterId: 1 });

export default mongoose.models.Baldosa || mongoose.model<IBaldosa>('Baldosa', baldosaSchema);
