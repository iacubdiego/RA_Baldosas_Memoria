import mongoose from 'mongoose';

export interface IPropuesta {
  _id: string;
  nombrePersona: string;
  descripcion: string;
  ubicacion: {
    type: 'Point';
    coordinates: [number, number];
  };
  direccion?: string;
  imagenBase64?: string;
  emailContacto?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

const propuestaSchema = new mongoose.Schema<IPropuesta>({
  nombrePersona: { 
    type: String, 
    required: true 
  },
  descripcion: { 
    type: String, 
    required: true 
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
  imagenBase64: String,
  emailContacto: String,
  estado: { 
    type: String, 
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
  },
  notas: String,
}, { 
  timestamps: true 
});

propuestaSchema.index({ ubicacion: '2dsphere' });
propuestaSchema.index({ estado: 1 });

export default mongoose.models.Propuesta || mongoose.model<IPropuesta>('Propuesta', propuestaSchema);
