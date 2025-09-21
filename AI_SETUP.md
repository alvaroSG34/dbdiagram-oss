# Configuración de IA para dbdiagram-oss

## 🚀 Configuración Rápida

### 1. Obtener API Key de Google Gemini (GRATIS)

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crea una cuenta o inicia sesión
3. Haz clic en "Create API Key"
4. Copia la API key

### 2. Configurar en la Aplicación

**Opción A: Variables de Entorno (Recomendado para producción)**
```bash
# En .env
GEMINI_API_KEY=tu_api_key_aqui
```

**Opción B: LocalStorage (Desarrollo rápido)**
1. Abre la aplicación en el navegador
2. Abre DevTools (F12) → Console
3. Ejecuta:
```javascript
localStorage.setItem('ai_gemini_key', 'tu_api_key_aqui')
```

### 3. Probar la Funcionalidad
- Abre el Chat Panel
- Escribe: "Crea tablas para usuarios, roles y permisos"
- ¡Debería generar código DBML automáticamente!

## 🔄 Migración Futura a OpenAI GPT-4o

Cuando quieras migrar a OpenAI:

1. Obtén API key de OpenAI
2. Configura `OPENAI_API_KEY`
3. En la aplicación:
```javascript
aiService.switchProvider('openai')
```

¡Sin cambios de código adicionales!

## 📊 Límites Gratuitos

**Google Gemini:**
- ✅ 15 requests/minuto
- ✅ 1,000,000 tokens/mes
- ✅ Perfecto para desarrollo

**OpenAI GPT-4o Mini (futuro):**
- 💰 $0.150 / 1M input tokens
- 💰 $0.600 / 1M output tokens
- ⚡ Mayor calidad y velocidad

## 🛠️ Troubleshooting

**Si no funciona:**
1. Verifica tu API key en la consola
2. Revisa que tengas internet
3. El sistema automáticamente usará datos mock si falla

**Logs útiles:**
```javascript
// Ver estado actual
aiService.getProviderInfo()

// Cambiar proveedor manualmente
aiService.switchProvider('gemini')

// Probar generación
aiService.generateDbml("Crea una tabla de usuarios")
```