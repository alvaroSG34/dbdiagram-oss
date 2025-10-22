# 🔄 Cambios en la Configuración de IA - Eliminación de Configuración Manual

## 📋 Resumen

Se ha simplificado la configuración del chatbot AI eliminando la necesidad de que los usuarios ingresen manualmente las API keys. Ahora las keys se configuran una sola vez en el archivo `.env` del proyecto.

---

## ✅ Cambios Implementados

### 1. **Variables de Entorno en `/web/.env`**

Las API keys ahora se definen en el archivo de configuración:

```env
# Google Gemini API Key (FREE)
GEMINI_API_KEY=AIzaSy...

# OpenAI API Key (PAID - Opcional)
OPENAI_API_KEY=sk-proj-...

# Provider por defecto
AI_PROVIDER=gemini
```

### 2. **Configuración de Quasar (`web/quasar.conf.js`)**

Se agregaron las variables de entorno al build config para que estén disponibles en el frontend:

```javascript
build: {
  env: {
    ...require("dotenv").config().parsed,
    API_BASE_URL: process.env.API_BASE_URL || '...',
    SOCKET_URL: process.env.SOCKET_URL || '...',
    // ✨ NUEVAS VARIABLES
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    DEFAULT_AI_PROVIDER: process.env.AI_PROVIDER || 'gemini'
  }
}
```

### 3. **ChatPanel.vue - Lectura Automática**

#### Antes (❌ localStorage manual):
```javascript
const generateWithGemini = async (prompt, systemPrompt, startTime) => {
  const apiKey = localStorage.getItem('ai_gemini_key')  // ❌ Manual
  
  if (!apiKey) {
    throw new Error('Please add your API key in the settings.')
  }
  // ...
}
```

#### Después (✅ Variables de entorno):
```javascript
const generateWithGemini = async (prompt, systemPrompt, startTime) => {
  const apiKey = process.env.GEMINI_API_KEY  // ✅ Automático
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured in .env file.')
  }
  // ...
}
```

### 4. **UI Simplificada**

- ❌ **Eliminado**: Botón de Settings (⚙️)
- ❌ **Eliminado**: Diálogo de configuración de API keys
- ❌ **Eliminado**: Input para pegar API keys manualmente
- ✅ **Mantenido**: Selector de provider (si se configuraron múltiples)

---

## 🚀 Flujo de Usuario - Antes vs Después

### ❌ **ANTES (Manual)**

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as ChatPanel UI
    participant LS as localStorage
    participant AI as Gemini API

    U->>UI: 1️⃣ Abrir chatbot
    UI->>LS: Verificar si existe 'ai_gemini_key'
    LS-->>UI: ❌ No encontrada
    UI->>U: ⚠️ "Configure API key first"
    U->>UI: 2️⃣ Clic en Settings ⚙️
    U->>UI: 3️⃣ Ir a aistudio.google.com
    U->>UI: 4️⃣ Copiar API key
    U->>UI: 5️⃣ Pegar en input
    U->>UI: 6️⃣ Clic "Save"
    UI->>LS: localStorage.setItem('ai_gemini_key', key)
    U->>UI: 7️⃣ Escribir prompt
    UI->>AI: Generar DBML
```

**Pasos requeridos: 7** 😓

---

### ✅ **DESPUÉS (Automático)**

```mermaid
sequenceDiagram
    participant D as Developer
    participant ENV as web/.env
    participant U as Usuario
    participant UI as ChatPanel UI
    participant AI as Gemini API

    Note over D,ENV: Configuración única (una vez)
    D->>ENV: GEMINI_API_KEY=AIza...
    
    Note over U,AI: Uso por cualquier usuario
    U->>UI: 1️⃣ Escribir prompt
    UI->>ENV: Leer process.env.GEMINI_API_KEY
    ENV-->>UI: ✅ Key configurada
    UI->>AI: Generar DBML
    AI-->>UI: Código DBML
    UI->>U: ✅ Mostrar resultado
```

**Pasos requeridos: 1** 🎉

---

## 📦 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `web/.env` | ✅ Creado - Define `GEMINI_API_KEY`, `OPENAI_API_KEY`, `AI_PROVIDER` |
| `web/env.example` | ✅ Actualizado - Documentación de nuevas variables |
| `web/quasar.conf.js` | ✅ Modificado - Inyecta variables de entorno en build |
| `web/src/components/ChatPanel.vue` | ✅ Modificado - Lee de `process.env` en lugar de `localStorage` |
| | ❌ Eliminado - Botón de settings |
| | ❌ Eliminado - Diálogo de configuración |
| | ❌ Eliminado - Función `saveSettings()` |

---

## 🔧 Guía de Configuración para Desarrolladores

### **Paso 1: Obtener API Key (una sola vez)**

#### Opción A: Google Gemini (Gratis 🆓)
1. Ir a: https://aistudio.google.com/app/apikey
2. Clic en "Create API Key"
3. Copiar la key generada

#### Opción B: OpenAI (Pago 💳)
1. Ir a: https://platform.openai.com/api-keys
2. Clic en "Create new secret key"
3. Copiar la key (no se volverá a mostrar)

### **Paso 2: Configurar en el Proyecto**

```bash
# En d:\dbdiagram-oss\web\
# Editar el archivo .env y pegar tu key:

GEMINI_API_KEY=AIzaSyDupbu4bgnXXi89itvOZtvUD0o_cfH9Y7c
AI_PROVIDER=gemini
```

### **Paso 3: Reiniciar Servidor de Desarrollo**

```bash
# Detener el servidor actual (Ctrl+C)
# Reiniciar:
cd web
quasar dev
```

### **Paso 4: ✅ Listo!**

El chatbot ya funcionará automáticamente para todos los usuarios sin necesidad de configuración adicional.

---

## 🔒 Seguridad

### ⚠️ **Consideraciones Importantes**

1. **NO subir `.env` a Git**:
   ```bash
   # Ya está en .gitignore
   web/.env
   ```

2. **Usar `.env.example` para documentación**:
   ```env
   # web/.env.example (SIN keys reales)
   GEMINI_API_KEY=
   OPENAI_API_KEY=
   ```

3. **En producción (Vercel/Netlify)**:
   - Configurar variables de entorno en el panel de administración
   - Settings → Environment Variables
   - Agregar: `GEMINI_API_KEY`, `OPENAI_API_KEY`

4. **Rotación de Keys**:
   - Si la key se compromete, rotarla en el proveedor
   - Actualizar el `.env` local
   - Reiniciar el servidor

---

## 🎯 Beneficios de Este Cambio

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Experiencia de Usuario** | ❌ Requiere configuración manual | ✅ Funciona inmediatamente |
| **Pasos para usar IA** | 7 pasos | 1 paso |
| **Curva de aprendizaje** | Alta (técnica) | Ninguna |
| **Configuración por usuario** | Cada usuario configura | Configuración única del dev |
| **Mantenimiento** | Cada usuario mantiene su key | Centralizado |
| **Onboarding** | Complejo | Simplificado |

---

## 🐛 Troubleshooting

### Error: "Gemini API key not configured in .env file"

**Causa**: El archivo `.env` no existe o está vacío.

**Solución**:
```bash
cd web
# Copiar el ejemplo
copy env.example .env

# Editar y agregar tu key
notepad .env
```

### Error: "Invalid API key"

**Causa**: La key en el `.env` es incorrecta o expiró.

**Solución**:
1. Verificar que la key no tenga espacios al inicio/final
2. Regenerar la key en el proveedor
3. Actualizar el `.env`

### El chatbot muestra respuestas mock

**Causa**: Las variables de entorno no se están inyectando correctamente.

**Solución**:
```bash
# Verificar que quasar.conf.js tiene la configuración
# Reiniciar completamente:
cd web
taskkill /F /IM node.exe
quasar dev
```

---

## 📚 Referencias

- [Gemini API Documentation](https://ai.google.dev/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Quasar Environment Variables](https://quasar.dev/quasar-cli/handling-process-env)
- [DBML Specification](https://www.dbml.org/docs/)

---

## ✅ Checklist de Migración

Para proyectos existentes que usen la versión anterior:

- [ ] Crear archivo `web/.env`
- [ ] Agregar `GEMINI_API_KEY=tu_key_aqui`
- [ ] Actualizar `web/quasar.conf.js` (ya hecho en este commit)
- [ ] Actualizar `ChatPanel.vue` (ya hecho en este commit)
- [ ] Reiniciar servidor de desarrollo
- [ ] Probar generación de DBML en el chatbot
- [ ] Verificar que no aparece el botón de Settings
- [ ] Documentar para el equipo

---

**Fecha de implementación**: Octubre 22, 2025  
**Autor**: Sistema de IA - dbdiagram-oss  
**Versión**: 2.0 - Configuración Automática
