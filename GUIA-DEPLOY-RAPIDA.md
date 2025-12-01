# 🚀 Guía Rápida de Deploy a Vercel

## ⚠️ Problema Actual

Tu repositorio en GitHub está **incompleto**. Faltan archivos necesarios:
- `components/MapView.tsx`
- `components/ARScanner.tsx`
- `lib/mongodb.ts`
- `models/Baldosa.ts`
- Y otros...

## ✅ Solución: Subir Proyecto Completo

### Opción 1: Reemplazar Todo el Repositorio (RECOMENDADO)

```bash
# 1. Descargar el ZIP proyecto-completo.zip
# 2. Extraer
unzip proyecto-completo.zip

# 3. Ir a tu repositorio local existente
cd ruta/a/tu/RA_Baldosas_Memoria

# 4. Respaldar (por si acaso)
cp -r . ../backup-repo

# 5. Borrar todo excepto .git
find . -maxdepth 1 ! -name '.git' ! -name '.' ! -name '..' -exec rm -rf {} \;

# 6. Copiar todos los archivos del proyecto completo
cp -r ../proyecto-completo/* .
cp ../proyecto-completo/.gitignore .
cp ../proyecto-completo/.npmrc .

# 7. Verificar archivos
ls -la

# 8. Commit y push
git add -A
git commit -m "chore: Proyecto completo con todas las dependencias"
git push origin main
```

### Opción 2: Desde Cero (Si tienes problemas)

```bash
# 1. Borrar el repo actual de GitHub (desde la web)

# 2. Crear nuevo repo en GitHub
# Nombre: RA_Baldosas_Memoria

# 3. Descargar el ZIP proyecto-completo.zip y extraer
unzip proyecto-completo.zip
cd proyecto-completo

# 4. Inicializar git
git init
git add .
git commit -m "Initial commit: MVP Baldosas por la Memoria"

# 5. Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/RA_Baldosas_Memoria.git
git branch -M main
git push -u origin main

# 6. Conectar con Vercel
# Ve a vercel.com y conecta el repo
```

## 📋 Checklist de Archivos Necesarios

Verifica que estos archivos existan:

```
✅ package.json
✅ .npmrc                    (IMPORTANTE para build)
✅ vercel.json               (IMPORTANTE para build)
✅ next.config.js
✅ tsconfig.json
✅ .gitignore
✅ .env.example

✅ app/
   ✅ layout.tsx
   ✅ page.tsx
   ✅ globals.css
   ✅ mapa/page.tsx
   ✅ scanner/page.tsx
   ✅ api/
      ✅ baldosas/nearby/route.ts
      ✅ baldosas/[id]/route.ts

✅ components/
   ✅ MapView.tsx
   ✅ ARScanner.tsx

✅ lib/
   ✅ mongodb.ts
   ✅ geo.ts

✅ models/
   ✅ Baldosa.ts
   ✅ Cluster.ts

✅ scripts/
   ✅ seed.js

✅ public/
   ✅ manifest.json
```

## 🔧 Configurar Variables de Entorno en Vercel

Una vez que el código esté en GitHub:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:

```
MONGODB_URI = mongodb+srv://usuario:password@cluster.mongodb.net/baldosas_db
NEXT_PUBLIC_APP_URL = https://tu-proyecto.vercel.app
```

## ✅ Build Exitoso Se Verá Así

```
✓ Installing dependencies...
✓ Building...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
✓ Deployment ready
```

## 🐛 Si Aún Hay Errores

### Error: "Module not found"
→ Falta subir archivos. Usa Opción 1 o 2 arriba.

### Error: "canvas" o "node-gyp"
→ Verifica que `.npmrc` y `vercel.json` estén en el repo.

### Error: "Cannot connect to MongoDB"
→ Configura MONGODB_URI en Vercel Settings.

---

**Nota**: El ZIP `proyecto-completo.zip` contiene TODA la estructura necesaria lista para subir a GitHub.
