import mongoose from 'mongoose';

export interface IColeccionItem {
  _id: string;
  userId: string; // ID del usuario
  baldosaId: string; // ID de la baldosa
  
  // Captura de pantalla del momento
  captura?: {
    imagenBase64?: string; // Screenshot en base64 (opcional)
    imagenUrl?: string; // URL si se sube a cloud storage
  };
  
  // Metadata del escaneo
  fecha: Date;
  ubicacion?: {
    lat: number;
    lng: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const coleccionSchema = new mongoose.Schema<IColeccionItem>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  baldosaId: {
    type: String,
    required: true,
    index: true,
  },
  captura: {
    imagenBase64: String,
    imagenUrl: String,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
  ubicacion: {
    lat: Number,
    lng: Number,
  },
}, {
  timestamps: true,
});

// Índices compuestos para búsquedas eficientes
coleccionSchema.index({ userId: 1, baldosaId: 1 }, { unique: true }); // Un usuario no puede tener duplicados
coleccionSchema.index({ userId: 1, fecha: -1 }); // Para ordenar por fecha
coleccionSchema.index({ baldosaId: 1 }); // Para estadísticas por baldosa

export default mongoose.models.Coleccion || mongoose.model<IColeccionItem>('Coleccion', coleccionSchema);
