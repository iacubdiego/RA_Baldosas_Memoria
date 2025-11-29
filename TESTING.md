# Testing y Checklist del MVP

## 🧪 Testing Local

### Preparación

1. **Asegúrate de tener MongoDB corriendo**
   ```bash
   # Verifica la conexión
   node -e "require('mongodb').MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017', (err, client) => { if (err) console.error('❌ Error:', err); else console.log('✅ MongoDB conectado'); process.exit(0); })"
   ```

2. **Poblar base de datos de prueba**
   ```bash
   node scripts/seed.js
   ```

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

### Test Cases

#### ✅ Página Principal (/)

- [ ] La página carga correctamente
- [ ] El título "Baldosas por la Memoria" es visible
- [ ] Los botones "Explorar Mapa" y "Escanear Baldosa" funcionan
- [ ] Las estadísticas se muestran correctamente
- [ ] La navegación superior funciona
- [ ] El footer es visible

#### ✅ Mapa (/mapa)

- [ ] Solicita permiso de geolocalización
- [ ] El mapa de Leaflet carga correctamente
- [ ] Se muestran las baldosas cercanas como marcadores
- [ ] Los marcadores tienen el icono personalizado (terracota)
- [ ] Al hacer click en un marcador, se muestra un popup
- [ ] El popup muestra: nombre, categoría, dirección, distancia
- [ ] El botón "Ver detalles" en el popup funciona
- [ ] El panel lateral lista las baldosas
- [ ] La lista se puede scrollear
- [ ] Al click en una baldosa de la lista, se selecciona en el mapa

**Testing con diferentes ubicaciones:**

```javascript
// En la consola del navegador, simula diferentes ubicaciones
// Buenos Aires Centro
navigator.geolocation.getCurrentPosition = (success) => success({
  coords: { latitude: -34.6037, longitude: -58.3816, accuracy: 10 }
});

// Palermo
navigator.geolocation.getCurrentPosition = (success) => success({
  coords: { latitude: -34.5875, longitude: -58.4200, accuracy: 10 }
});
```

#### ✅ Scanner AR (/scanner)

- [ ] Solicita permiso de cámara
- [ ] La cámara se activa correctamente
- [ ] Se muestra el mensaje "Apunta tu cámara a una baldosa"
- [ ] La lista de baldosas cercanas es visible
- [ ] El botón "Volver al mapa" funciona

**Nota**: Para testing completo del AR necesitas:
1. Imágenes físicas impresas de las baldosas
2. Archivos `.mind` compilados con MindAR
3. Un dispositivo móvil con cámara

#### ✅ API Endpoints

**GET /api/baldosas/nearby**

```bash
# Test con curl
curl "http://localhost:3000/api/baldosas/nearby?lat=-34.6037&lng=-58.3816&radius=1000"

# Debería retornar:
# - JSON con array de baldosas
# - Cada baldosa con: id, nombre, categoria, lat, lng, distancia
# - Array de clusters
```

**GET /api/baldosas/[id]**

```bash
# Primero obtén un ID del endpoint anterior, luego:
curl "http://localhost:3000/api/baldosas/[id-de-una-baldosa]"

# Debería retornar:
# - JSON con detalles completos de la baldosa
# - Campos: nombre, descripcion, categoria, ubicacion, etc.
```

## 📱 Testing Móvil

### Usando Chrome DevTools

1. Abre Chrome DevTools (F12)
2. Click en el icono de dispositivo móvil (Toggle device toolbar)
3. Selecciona un dispositivo (ej: iPhone 12 Pro)
4. Simula ubicación:
   - Click en "..." → "More tools" → "Sensors"
   - En "Location", selecciona "Custom location"
   - Ingresa lat: -34.6037, lng: -58.3816

### Testing en Dispositivo Real

1. **Conecta tu computadora y móvil a la misma red WiFi**

2. **Obtén tu IP local**
   ```bash
   # Linux/Mac
   ifconfig | grep inet
   
   # Windows
   ipconfig
   ```

3. **Inicia el servidor**
   ```bash
   npm run dev
   ```

4. **Accede desde el móvil**
   ```
   http://TU_IP_LOCAL:3000
   # Ejemplo: http://192.168.1.100:3000
   ```

5. **Testear**
   - Ubicación real del dispositivo
   - Cámara real
   - Gestos táctiles
   - Performance

## ⚡ Performance Testing

### Lighthouse Audit

1. Abre la app en Chrome
2. F12 → Tab "Lighthouse"
3. Selecciona:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
   - ✅ PWA
4. Click "Analyze page load"

**Metas mínimas:**
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80
- PWA: > 80

### Pruebas de Carga

```bash
# Usando Apache Bench (si está instalado)
ab -n 100 -c 10 "http://localhost:3000/api/baldosas/nearby?lat=-34.6037&lng=-58.3816&radius=1000"

# Debería manejar:
# - 100 requests
# - 10 concurrentes
# - Sin errores
```

## 🔍 Debugging

### MongoDB Queries

```javascript
// Conectarte a MongoDB y verificar datos
const { MongoClient } = require('mongodb');

async function debug() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('baldosas_db');
  
  // Ver todas las baldosas
  const baldosas = await db.collection('baldosas').find({}).toArray();
  console.log('Baldosas:', baldosas.length);
  
  // Ver baldosas cercanas
  const nearby = await db.collection('baldosas').find({
    ubicacion: {
      $near: {
        $geometry: { type: 'Point', coordinates: [-58.3816, -34.6037] },
        $maxDistance: 1000
      }
    }
  }).toArray();
  console.log('Cercanas:', nearby.length);
  
  await client.close();
}

debug();
```

### Logs útiles

Agrega estos logs temporales durante el desarrollo:

```typescript
// En app/api/baldosas/nearby/route.ts
console.log('📍 Query:', { lat, lng, radius });
console.log('🗄️ Baldosas encontradas:', baldosas.length);

// En components/MapView.tsx
console.log('🗺️ Baldosas cargadas:', baldosas);
console.log('📍 Ubicación usuario:', initialLocation);
```

## ✅ Checklist Pre-Deploy

### Código

- [ ] `.env.local` NO está en git (verificar .gitignore)
- [ ] Todas las dependencias están en `package.json`
- [ ] `npm run build` funciona sin errores
- [ ] No hay console.logs innecesarios en producción
- [ ] No hay TODOs críticos pendientes

### Base de Datos

- [ ] MongoDB Atlas configurado
- [ ] Índices geoespaciales creados
- [ ] Datos de ejemplo insertados
- [ ] Connection string funciona

### Funcionalidades

- [ ] Home page carga
- [ ] Mapa muestra baldosas
- [ ] Scanner pide permisos correctamente
- [ ] API responde correctamente
- [ ] Mobile responsive
- [ ] PWA installable

### Seguridad

- [ ] Variables sensibles en variables de entorno
- [ ] CORS configurado correctamente
- [ ] HTTPS habilitado (Vercel lo hace automático)
- [ ] MongoDB no expone credenciales

### Performance

- [ ] Imágenes optimizadas
- [ ] Lighthouse score aceptable (>80)
- [ ] Carga inicial < 3 segundos
- [ ] API responde en < 500ms

## 🚀 Checklist Post-Deploy

### Inmediatamente después del deploy

- [ ] La app carga en la URL de Vercel
- [ ] No hay errores en la consola
- [ ] MongoDB se conecta correctamente
- [ ] API endpoints responden

### Testing en producción

- [ ] Mapa funciona con ubicación real
- [ ] Datos se cargan correctamente
- [ ] No hay errores de CORS
- [ ] PWA es installable
- [ ] Funciona en Chrome móvil
- [ ] Funciona en Safari móvil

### Monitoreo

- [ ] Vercel Analytics activado
- [ ] Logs accesibles
- [ ] Dominio personalizado configurado (si aplica)

## 📋 Checklist de Features Futuras

Para la próxima versión:

- [ ] Sistema de propuestas
- [ ] Panel de administración
- [ ] Autenticación de usuarios
- [ ] Compilación de archivos .mind
- [ ] Notificaciones
- [ ] Modo offline
- [ ] Búsqueda de baldosas por nombre
- [ ] Filtros por categoría
- [ ] Compartir baldosas en redes sociales
- [ ] Estadísticas de uso

## 🐛 Bugs Conocidos

Documenta aquí cualquier bug conocido que no sea crítico:

```
1. [Descripción del bug]
   - Severidad: baja/media/alta
   - Pasos para reproducir: ...
   - Workaround: ...

2. ...
```

## 📊 Métricas de Éxito

Después de lanzar, monitorea:

- **Usuarios únicos diarios**
- **Baldosas escaneadas**
- **Tiempo promedio en la app**
- **Tasa de instalación PWA**
- **Dispositivos más usados**
- **Errores en producción**

---

**¡Buena suerte con el MVP! 🎉**
