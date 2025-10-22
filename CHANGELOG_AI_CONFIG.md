# 🎉 Changelog: Configuración Automática de API Keys para AI Chatbot

**Fecha:** 22 de Octubre, 2025  
**Versión:** 2.0.0  
**Tipo de cambio:** Breaking Change (mejora la experiencia del usuario)

---

## 📝 Resumen

Se eliminó la necesidad de configuración manual de API keys en el frontend. Ahora las API keys se configuran **una sola vez** en el archivo `.env` y funcionan automáticamente.

---

## ✨ Cambios Realizados

### 1. **Configuración Centralizada en `.env`**

#### Antes:
```javascript
// El usuario tenía que:
// 1. Ir a Settings ⚙️ en el ChatPanel
// 2. Seleccionar provider (Gemini/OpenAI)
// 3. Pegar manualmente la API key
// 4. Guardar (se almacenaba en localStorage)
```

#### Después:
```bash
# web/.env
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-proj-...
DEFAULT_AI_PROVIDER=gemini
```

**Beneficios:**
- ✅ Configuración una sola vez
- ✅ No requiere interacción del usuario
- ✅ Más seguro (no expuesto en DevTools)
- ✅ Fácil de cambiar entre entornos (dev/prod)

---

### 2. **Inyección Automática de Variables de Entorno**

**Archivo modificado:** `web/quasar.conf.js`

```javascript
build: {
  env: {
    // ... existing vars
    // 🆕 Nuevas variables para AI
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    DEFAULT_AI_PROVIDER: process.env.AI_PROVIDER || 'gemini'
  }
}
```

Quasar ahora inyecta estas variables en el build, haciéndolas accesibles vía `process.env.*`

---

### 3. **Eliminación de Configuración Manual**

**Archivo modificado:** `web/src/components/ChatPanel.vue`

#### Cambios en el código:

**Antes:**
```javascript
const generateWithGemini = async (prompt, systemPrompt, startTime) => {
  const apiKey = localStorage.getItem('ai_gemini_key')  // ❌ Manual
  
  if (!apiKey) {
    throw new Error('Please configure API key in settings')
  }
  // ...
}
```

**Después:**
```javascript
const generateWithGemini = async (prompt, systemPrompt, startTime) => {
  const apiKey = process.env.GEMINI_API_KEY  // ✅ Automático
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured in .env file')
  }
  // ...
}
```

#### Elementos eliminados:
- ❌ Botón de Settings ⚙️ en el header del chat
- ❌ Dialog de configuración con inputs para API keys
- ❌ Función `saveSettings()`
- ❌ Variable `apiKeyInput`
- ❌ Variable `showSettings`
- ❌ Referencias a `localStorage.setItem('ai_*_key')`
- ❌ Referencias a `localStorage.getItem('ai_*_key')`

#### Elementos modificados:
- ✅ `generateWithGemini()` - lee de `process.env.GEMINI_API_KEY`
- ✅ `generateWithOpenAI()` - lee de `process.env.OPENAI_API_KEY`
- ✅ `analyzeWithGeminiVision()` - lee de `process.env.GEMINI_API_KEY`
- ✅ `analyzeWithOpenAIVision()` - lee de `process.env.OPENAI_API_KEY`
- ✅ `availableProviders` - ahora es computed, filtra por keys disponibles
- ✅ `providerInfo` - detecta keys automáticamente

---

### 4. **Actualización de Documentación**

**Archivos modificados:**
- `web/env.example` - Agregadas variables de AI con comentarios explicativos
- `web/README.md` - Nueva sección de configuración de AI
- `CHANGELOG_AI_CONFIG.md` - Este documento

---

## 🔄 Migración

### Para Desarrolladores Existentes:

1. **Actualizar el repositorio:**
   ```bash
   git pull origin main
   ```

2. **Copiar el nuevo template de .env:**
   ```bash
   cd web
   cp env.example .env
   ```

3. **Agregar tus API keys al `.env`:**
   ```bash
   # web/.env
   GEMINI_API_KEY=AIzaSy...  # Tu key existente
   OPENAI_API_KEY=sk-proj-... # Opcional
   ```

4. **Reinstalar dependencias (opcional, solo si hay cambios):**
   ```bash
   npm install
   ```

5. **Reiniciar el servidor de desarrollo:**
   ```bash
   quasar dev
   ```

6. **Limpiar localStorage (opcional, para eliminar keys antiguas):**
   ```javascript
   // Abrir DevTools > Console > Ejecutar:
   localStorage.removeItem('ai_gemini_key')
   localStorage.removeItem('ai_openai_key')
   ```

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: "API key not configured in .env file"

**Causa:** El archivo `.env` no existe o no tiene la variable configurada.

**Solución:**
```bash
cd web
# Verificar que existe .env
cat .env

# Si no existe, copiar desde template
cp env.example .env

# Editar y agregar tu API key
nano .env  # o tu editor preferido
```

---

### Problema: "process.env.GEMINI_API_KEY is undefined"

**Causa:** El servidor de desarrollo no se reinició después de modificar `.env`

**Solución:**
```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
quasar dev
```

---

### Problema: Botón de Settings desapareció

**Respuesta:** Esto es intencional. Las API keys ahora se configuran en `.env`, no en la UI.

**Alternativa:** Si necesitas cambiar de provider, puedes hacerlo en `.env`:
```bash
DEFAULT_AI_PROVIDER=openai  # o gemini
```

---

## 📊 Comparación: Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Configuración** | Manual en UI (Settings) | Automática desde `.env` |
| **Almacenamiento** | localStorage (texto plano) | Variables de entorno |
| **Seguridad** | Expuesto en DevTools | Más seguro (build-time) |
| **Pasos para configurar** | 4 pasos (Settings → Seleccionar → Pegar → Guardar) | 1 paso (editar `.env`) |
| **Cambio de provider** | Requiere abrir UI | Cambiar en `.env` |
| **Multi-entorno** | Difícil (copiar keys manualmente) | Fácil (archivos `.env` separados) |
| **Onboarding** | Usuario debe descubrir Settings | Documentado en README |

---

## 🎯 Próximos Pasos (Opcional)

### Mejoras Futuras Sugeridas:

1. **Cifrado de API Keys en Build:**
   - Usar herramientas como `dotenv-webpack` con cifrado
   - Implementar rotación de keys

2. **Proxy Backend (para producción):**
   - Mover API keys completamente al backend
   - Cliente solo envía prompts, servidor hace las llamadas
   - Ventajas: keys nunca expuestas, mejor control de costos

3. **Validación de Keys en Startup:**
   - Al iniciar `quasar dev`, verificar si las keys son válidas
   - Mostrar warning si no hay keys configuradas

4. **UI de Estado:**
   - Chip indicador mostrando qué providers están disponibles
   - Tooltip explicando cómo configurar keys

---

## 🙏 Agradecimientos

Cambio implementado para mejorar la experiencia del desarrollador y reducir la fricción al usar las funcionalidades de IA.

---

## 📞 Soporte

Si tienes problemas con la migración:
1. Revisa la sección "Problemas Conocidos" arriba
2. Verifica que tu `.env` esté correctamente configurado
3. Abre un issue en GitHub con detalles del error

---

**Versión anterior (rollback):** Si necesitas volver a la versión anterior con configuración manual:
```bash
git checkout <commit-anterior>
```
