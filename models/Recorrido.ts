import mongoose from 'mongoose';

const recorridoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  baldosaId: {
    type: String,
    required: true
  },
  nombreVictima: {
    type: String,
    required: true
  },
  fechaDesaparicion: {
    type: String,
    default: ''
  },
  fechaEscaneo: {
    type: Date,
    required: true,
    default: Date.now
  },
  fotoBase64: {
    type: String,
    required: true
  },
  ubicacion: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  notas: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar duplicados por usuario
recorridoSchema.index({ userId: 1, baldosaId: 1 }, { unique: true });

const Recorrido = mongoose.models.Recorrido || mongoose.model('Recorrido', recorridoSchema);

export default Recorrido;
