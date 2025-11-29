# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu aplicación Baldosas por la Memoria en Vercel paso a paso.

## 📋 Requisitos Previos

1. ✅ Cuenta de GitHub
2. ✅ Cuenta de Vercel (gratis)
3. ✅ Cuenta de MongoDB Atlas (gratis)
4. ✅ Código del proyecto en un repositorio de GitHub

## 🚀 Paso 1: Preparar MongoDB Atlas

### 1.1 Crear cuenta y cluster

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Crea una cuenta gratuita
3. Crea un cluster M0 (Free tier)
4. Selecciona la región más cercana a tus usuarios (ej: AWS São Paulo para Argentina)

### 1.2 Configurar acceso

1. En "Database Access", crea un usuario:
   - Username: `baldosas_admin`
   - Password: (genera una contraseña segura y guárdala)
   - Roles: `readWrite` en `baldosas_db`

2. En "Network Access", agrega acceso:
   - Click en "Add IP Address"
   - Selecciona "Allow Access from Anywhere" (0.0.0.0/0)
   - Esto es necesario para que Vercel pueda conectarse

### 1.3 Obtener connection string

1. En "Database", click en "Connect"
2. Selecciona "Connect your application"
3. Copia la connection string, se ve así:
   ```
   mongodb+srv://baldosas_admin:<password>@cluster0.xxxxx.mongodb.net/
   ```
4. Reemplaza `<password>` con la contraseña del paso 1.2
5. Agrega el nombre de la base de datos al final:
   ```
   mongodb+srv://baldosas_admin:tupassword@cluster0.xxxxx.mongodb.net/baldosas_db
   ```

## 📦 Paso 2: Preparar el Código en GitHub

### 2.1 Crear repositorio

```bash
# En tu proyecto local
git init
git add .
git commit -m "Initial commit"

# Crear repo en GitHub y conectarlo
git remote add origin https://github.com/tu-usuario/baldosas-memoria.git
git branch -M main
git push -u origin main
```

### 2.2 Verificar archivos importantes

Asegúrate de tener estos archivos:
- ✅ `.gitignore` (para excluir node_modules y .env.local)
- ✅ `package.json`
- ✅ `next.config.js`
- ✅ `.env.example` (como referencia)

## 🌐 Paso 3: Desplegar en Vercel

### 3.1 Conectar Vercel con GitHub

1. Ve a [Vercel](https://vercel.com)
2. Click en "Sign Up" y selecciona "Continue with GitHub"
3. Autoriza a Vercel para acceder a tus repositorios

### 3.2 Importar proyecto

1. En el dashboard de Vercel, click en "Add New..." → "Project"
2. Busca tu repositorio `baldosas-memoria`
3. Click en "Import"

### 3.3 Configurar el proyecto

1. **Framework Preset**: Next.js (se detecta automáticamente)
2. **Root Directory**: ./
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)

### 3.4 Configurar variables de entorno

Click en "Environment Variables" y agrega:

| Name | Value | Ejemplo |
|------|-------|---------|
| `MONGODB_URI` | Tu connection string | `mongodb+srv://user:pass@cluster.mongodb.net/baldosas_db` |
| `NEXT_PUBLIC_APP_URL` | (dejar vacío por ahora) | Se completará después |

### 3.5 Desplegar

1. Click en "Deploy"
2. Espera 2-3 minutos mientras se construye
3. ¡Listo! Tu app estará en `https://tu-proyecto.vercel.app`

### 3.6 Actualizar NEXT_PUBLIC_APP_URL

1. Copia la URL de tu proyecto (ej: `https://baldosas-memoria.vercel.app`)
2. Ve a "Settings" → "Environment Variables"
3. Edita `NEXT_PUBLIC_APP_URL` y pon tu URL
4. Redeploy desde "Deployments" → "..." → "Redeploy"

## 🗄️ Paso 4: Poblar la Base de Datos

### Opción A: Desde tu computadora local

```bash
# 1. Configura .env.local con tu MONGODB_URI de producción
echo "MONGODB_URI=mongodb+srv://..." > .env.local

# 2. Ejecuta el script de seed
node scripts/seed.js
```

### Opción B: Usar MongoDB Compass (GUI)

1. Descarga [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Conecta usando tu connection string
3. Crea la base de datos `baldosas_db`
4. Importa manualmente los datos de ejemplo

## ✅ Paso 5: Verificar que todo funciona

### 5.1 Probar la app

1. Ve a tu URL de Vercel
2. Navega a `/mapa`
3. Permite acceso a ubicación
4. Deberías ver las 5 baldosas de ejemplo en el mapa

### 5.2 Probar la API

```bash
# Prueba el endpoint de baldosas cercanas
curl "https://tu-app.vercel.app/api/baldosas/nearby?lat=-34.6037&lng=-58.3816&radius=1000"
```

Deberías recibir un JSON con las baldosas.

## 🔧 Configuración Adicional

### Dominio personalizado (Opcional)

1. En Vercel, ve a "Settings" → "Domains"
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

### Analytics

1. En Vercel, ve a "Analytics"
2. Activa "Web Analytics" (gratis)
3. Verás métricas de uso de tu app

## 🐛 Troubleshooting

### Error: "Cannot connect to MongoDB"

- ✅ Verifica que el connection string sea correcto
- ✅ Verifica que hayas permitido acceso desde "cualquier IP" (0.0.0.0/0)
- ✅ Verifica que el usuario tenga permisos `readWrite`

### Error: "Module not found"

```bash
# Asegúrate de que todas las dependencias estén en package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

Vercel automáticamente redesplegaré.

### Mapa no carga

- ✅ Verifica que Leaflet esté instalado: `npm install leaflet react-leaflet`
- ✅ Revisa la consola del navegador para errores
- ✅ Verifica que las URLs de tiles de OpenStreetMap estén accesibles

### AR no funciona

- ✅ Verifica que estés usando HTTPS (Vercel lo hace automático)
- ✅ Prueba en Chrome móvil (mejor soporte para WebRTC)
- ✅ Asegúrate de dar permisos de cámara

## 🔄 Flujo de Desarrollo Continuo

```bash
# 1. Hacer cambios localmente
# 2. Testear
npm run dev

# 3. Commit y push
git add .
git commit -m "Add new feature"
git push

# 4. Vercel automáticamente despliega
# 5. Verifica en tu-app.vercel.app
```

## 📊 Monitoreo

### Ver logs en tiempo real

```bash
# Instalar Vercel CLI
npm i -g vercel

# Ver logs de producción
vercel logs
```

### Rollback si algo falla

1. Ve a "Deployments" en Vercel
2. Encuentra un deploy anterior que funcionaba
3. Click en "..." → "Promote to Production"

## 🎉 ¡Listo!

Tu aplicación ahora está en producción y accesible desde cualquier lugar.

URL de ejemplo: `https://baldosas-memoria.vercel.app`

### Próximos pasos:

1. ✨ Agregar más baldosas a la base de datos
2. 🖼️ Subir imágenes reales de las baldosas
3. 🎵 Agregar archivos de audio
4. 📱 Compartir con usuarios para testing
5. 🔄 Implementar sistema de propuestas (próxima versión)

---

**¿Problemas?** Abre un issue en GitHub o contacta al equipo de desarrollo.
