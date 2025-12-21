import mongoose from 'mongoose';

export interface ICluster {
  _id: string;
  codigo: string;
  centro: {
    type: 'Point';
    coordinates: [number, number];
  };
  radio: number;
  barrio?: string;
  mindFileUrl?: string;
  version: number;
  baldosasCount: number;
  maxBaldosas: number;
  necesitaRecompilacion: boolean;
  ultimaCompilacion?: Date;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clusterSchema = new mongoose.Schema<ICluster>({
  codigo: { 
    type: String, 
    required: true, 
    unique: true 
  },
  centro: {
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
  radio: { 
    type: Number, 
    default: 100 
  },
  barrio: String,
  mindFileUrl: String,
  version: { 
    type: Number, 
    default: 1 
  },
  baldosasCount: { 
    type: Number, 
    default: 0 
  },
  maxBaldosas: { 
    type: Number, 
    default: 10 
  },
  necesitaRecompilacion: { 
    type: Boolean, 
    default: false 
  },
  ultimaCompilacion: Date,
  activo: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

clusterSchema.index({ centro: '2dsphere' });
clusterSchema.index({ activo: 1 });

export default mongoose.models.Cluster || mongoose.model<ICluster>('Cluster', clusterSchema);
