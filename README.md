# Baldosas por la Memoria - MVP

Aplicación web progresiva (PWA) para descubrir y escanear baldosas históricas de Buenos Aires usando realidad aumentada.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Database**: MongoDB Atlas
- **Maps**: React Leaflet
- **AR**: A-Frame + MindAR
- **Deploy**: Vercel
- **Storage**: Cloudflare R2 / Vercel Blob

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en MongoDB Atlas (gratis)
- Cuenta en Vercel (gratis)
- (Opcional) Cuenta en Cloudflare R2 para storage

## 🛠️ Instalación Local

### 1. Clonar el proyecto

```bash
git clone <tu-repo>
cd baldosas-mvp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local` y completa:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/baldosas_db

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Storage (opcional por ahora)
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com
```

### 4. Configurar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Crea una base de datos llamada `baldosas_db`
4. Obtén la connection string y ponla en `MONGODB_URI`

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Deploy en Vercel

### Opción A: Deploy desde GitHub (Recomendado)

1. Sube tu código a GitHub
2. Ve a [Vercel](https://vercel.com)
3. Click en "New Project"
4. Importa tu repositorio
5. Configura las variables de entorno:
   - `MONGODB_URI`
   - `NEXT_PUBLIC_APP_URL` (ej: https://tu-app.vercel.app)
6. Click en "Deploy"

### Opción B: Deploy desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Para producción
vercel --prod
```

### Configurar variables en Vercel

```bash
vercel env add MONGODB_URI
vercel env add NEXT_PUBLIC_APP_URL
```

## 🗄️ Poblar Base de Datos (Datos de Prueba)

Para testing, puedes usar este script de Node.js para insertar baldosas de ejemplo:

```javascript
// scripts/seed.js
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'tu-connection-string';

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  
  const db = client.db('baldosas_db');
  const baldosas = db.collection('baldosas');
  
  // Baldosas de ejemplo en Buenos Aires
  await baldosas.insertMany([
    {
      codigo: 'BALD-001',
      nombre: 'Jorge Luis Borges',
      descripcion: 'Escritor, poeta y ensayista argentino',
      categoria: 'artista',
      ubicacion: {
        type: 'Point',
        coordinates: [-58.3816, -34.6037]
      },
      direccion: 'Av. Corrientes 1234',
      barrio: 'San Telmo',
      imagenUrl: 'https://example.com/borges.jpg',
      mensajeAR: '📚 JORGE LUIS BORGES - Escritor',
      infoExtendida: 'Uno de los autores más destacados de la literatura del siglo XX',
      vecesEscaneada: 0,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      codigo: 'BALD-002',
      nombre: 'Mercedes Sosa',
      descripcion: 'Cantante folklórica argentina',
      categoria: 'artista',
      ubicacion: {
        type: 'Point',
        coordinates: [-58.3826, -34.6047]
      },
      direccion: 'Av. de Mayo 1100',
      barrio: 'Monserrat',
      imagenUrl: 'https://example.com/sosa.jpg',
      mensajeAR: '🎤 MERCEDES SOSA - La voz de América Latina',
      infoExtendida: 'Reconocida cantante de folklore argentino',
      vecesEscaneada: 0,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  console.log('✅ Base de datos poblada con datos de ejemplo');
  await client.close();
}

seed().catch(console.error);
```

Ejecutar:

```bash
node scripts/seed.js
```

## 📱 Uso de la Aplicación

### Mapa

- Ve a `/mapa`
- Permite acceso a tu ubicación
- Explora baldosas cercanas en el mapa interactivo
- Click en marcadores para ver detalles

### Scanner AR

- Ve a `/scanner`
- Permite acceso a la cámara
- Apunta tu cámara a una baldosa física
- La app detectará la baldosa y mostrará información aumentada

## 🏗️ Estructura del Proyecto

```
baldosas-mvp/
├── app/
│   ├── api/
│   │   └── baldosas/
│   │       ├── nearby/route.ts    # API baldosas cercanas
│   │       └── [id]/route.ts      # API detalle baldosa
│   ├── mapa/
│   │   └── page.tsx               # Página del mapa
│   ├── scanner/
│   │   └── page.tsx               # Página del scanner AR
│   ├── globals.css                # Estilos globales
│   ├── layout.tsx                 # Layout principal
│   └── page.tsx                   # Home
├── components/
│   ├── MapView.tsx                # Componente mapa Leaflet
│   └── ARScanner.tsx              # Componente scanner AR
├── lib/
│   ├── mongodb.ts                 # Conexión MongoDB
│   └── geo.ts                     # Utilidades geográficas
├── models/
│   ├── Baldosa.ts                 # Modelo baldosa
│   └── Cluster.ts                 # Modelo cluster
├── public/
│   └── manifest.json              # PWA manifest
└── package.json
```

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Start producción
npm start

# Lint
npm run lint
```

## 📊 Próximas Features (Versión Futura)

- [ ] Sistema de propuestas de nuevas baldosas
- [ ] Panel de administración
- [ ] Autenticación de usuarios
- [ ] Compilación automática de archivos .mind
- [ ] Sistema de clusters dinámicos
- [ ] Notificaciones push
- [ ] Modo offline con Service Worker

## 🐛 Troubleshooting

### Error: "Cannot find module 'mongodb'"

```bash
npm install mongodb mongoose
```

### AR no funciona en móvil

- Verifica que estés usando HTTPS (Vercel lo hace automático)
- Asegúrate de dar permisos de cámara
- Prueba en Chrome/Safari móvil

### Mapa no carga

- Verifica conexión a internet
- Revisa consola del navegador
- Verifica que la API key de geolocalización esté configurada

## 📝 Licencia

MIT

## 🤝 Contribuir

Este es un proyecto de memoria colectiva. Las contribuciones son bienvenidas.

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Desarrollado con ❤️ para preservar la memoria histórica de Buenos Aires**
