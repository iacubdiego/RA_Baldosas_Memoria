#!/bin/bash

echo "╔══════════════════════════════════════════════╗"
echo "║  INSTALACIÓN: ADMIN AUTOMATIZADO            ║"
echo "║  Baldosas por la Memoria                    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

echo "📦 Proyecto: $(grep '"name"' package.json | head -1 | cut -d'"' -f4)"
echo ""

read -p "¿Continuar? (s/n): " confirm
if [ "$confirm" != "s" ]; then
    echo "Instalación cancelada"
    exit 0
fi

echo ""
echo "🚀 Instalando..."
echo ""

# 1. API Endpoint
echo "1/5 API Endpoint..."
mkdir -p app/api/propuestas/\[id\]/convertir
if [ -f "/mnt/user-data/outputs/app/api/propuestas/[id]/convertir/route.ts" ]; then
    cp "/mnt/user-data/outputs/app/api/propuestas/[id]/convertir/route.ts" \
       app/api/propuestas/\[id\]/convertir/
    echo "   ✅ Instalado"
else
    echo "   ❌ Archivo no encontrado"
fi

# 2. Componente Modal
echo "2/5 Componente Modal..."
mkdir -p components
if [ -f "/mnt/user-data/outputs/components/ConvertirModal.tsx" ]; then
    cp "/mnt/user-data/outputs/components/ConvertirModal.tsx" components/
    echo "   ✅ Instalado"
else
    echo "   ❌ Archivo no encontrado"
fi

# 3. Admin Page
echo "3/5 Admin Page..."
if [ -f "app/admin/page.tsx" ]; then
    cp app/admin/page.tsx app/admin/page.tsx.backup
    echo "   📦 Backup creado: app/admin/page.tsx.backup"
fi

if [ -f "/mnt/user-data/outputs/app/admin/page.tsx" ]; then
    mkdir -p app/admin
    cp "/mnt/user-data/outputs/app/admin/page.tsx" app/admin/
    echo "   ✅ Instalado"
else
    echo "   ❌ Archivo no encontrado"
fi

# 4. Directorios
echo "4/5 Creando directorios..."
mkdir -p public/targets
mkdir -p public/images/baldosas
echo "   ✅ Directorios creados"

# 5. Verificar
echo "5/5 Verificando instalación..."
ERRORS=0

if [ ! -f "app/api/propuestas/[id]/convertir/route.ts" ]; then
    echo "   ❌ API endpoint falta"
    ERRORS=$((ERRORS + 1))
fi

if [ ! -f "components/ConvertirModal.tsx" ]; then
    echo "   ❌ Modal falta"
    ERRORS=$((ERRORS + 1))
fi

if [ ! -f "app/admin/page.tsx" ]; then
    echo "   ❌ Admin page falta"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "   ✅ Todo instalado correctamente"
else
    echo "   ⚠️  $ERRORS archivo(s) faltante(s)"
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ INSTALACIÓN COMPLETADA                  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Reiniciar servidor:"
echo "   npm run dev"
echo ""
echo "2. Acceder al admin:"
echo "   http://localhost:3000/admin"
echo ""
echo "3. Probar flujo:"
echo "   • Crear propuesta en /colaborar"
echo "   • Aprobar en /admin"
echo "   • Click 'Convertir a Baldosa'"
echo "   • Compilar .mind online"
echo "   • Subir y confirmar"
echo ""
echo "📖 Ver guía completa:"
echo "   INSTALACION_ADMIN_AUTO.md"
echo ""
