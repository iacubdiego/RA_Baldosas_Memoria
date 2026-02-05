import mongoose from 'mongoose';

export interface IUsuario {
  _id: string;
  email: string;
  password: string; // hash bcrypt
  nombre: string;
  createdAt: Date;
  updatedAt: Date;
}

const usuarioSchema = new mongoose.Schema<IUsuario>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

// Índice para búsquedas rápidas por email
usuarioSchema.index({ email: 1 });

export default mongoose.models.Usuario || mongoose.model<IUsuario>('Usuario', usuarioSchema);
