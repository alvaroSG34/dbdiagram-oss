# Configuración para Producción

## Variables de Entorno Requeridas

Crea un archivo `.env` en la carpeta `web/` con las siguientes variables:

```bash
# URLs del backend (ajustar según tu dominio de producción)
API_BASE_URL=https://tu-dominio.com/api
SOCKET_URL=https://tu-dominio.com

# O para usar URLs relativas (recomendado para la mayoría de casos)
# API_BASE_URL=/api
# SOCKET_URL=

# Configuración de AI (opcional)
GEMINI_API_KEY=tu_api_key_de_gemini
OPENAI_API_KEY=tu_api_key_de_openai
```

## Configuración del Servidor de Producción

### 1. **Nginx (Recomendado)**

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    # Servir archivos estáticos del frontend
    location / {
        root /path/to/web/dist/spa;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy para API
    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Proxy para WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. **Apache**

```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    DocumentRoot /path/to/web/dist/spa
    
    # Servir archivos estáticos
    <Directory "/path/to/web/dist/spa">
        AllowOverride All
        Require all granted
    </Directory>
    
    # Proxy para API
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3003/api
    ProxyPassReverse /api http://localhost:3003/api
    
    # Proxy para WebSocket
    ProxyPass /socket.io/ ws://localhost:3003/socket.io/
    ProxyPassReverse /socket.io/ ws://localhost:3003/socket.io/
</VirtualHost>
```

## Comandos de Build para Producción

```bash
# 1. Instalar dependencias
cd web
npm install

# 2. Crear archivo .env con las variables de entorno
cp env.example .env
# Editar .env con tus valores

# 3. Build para producción
npm run build

# 4. Los archivos estarán en web/dist/spa/
```

## Verificación de Configuración

### 1. **Verificar URLs Dinámicas**

Los archivos ahora usan configuración dinámica:

- **Desarrollo**: `http://localhost:3003`
- **Producción**: Variables de entorno o URLs relativas

### 2. **Archivos Actualizados**

✅ `web/src/boot/axios.js` - URL dinámica para API
✅ `web/src/pages/RoomEditor.vue` - URL dinámica para WebSocket  
✅ `web/src/stores/room.js` - URL dinámica para WebSocket
✅ `web/src/services/aiService.js` - Ya compatible con producción
✅ `web/src/services/springBootExportService.js` - Ya compatible con producción

### 3. **Variables de Entorno Soportadas**

- `API_BASE_URL` - URL del backend API
- `SOCKET_URL` - URL del servidor WebSocket
- `GEMINI_API_KEY` - API key para Gemini AI
- `OPENAI_API_KEY` - API key para OpenAI

## Troubleshooting

### Error: "Cannot connect to API"
- Verificar que `API_BASE_URL` esté configurado correctamente
- Verificar que el backend esté corriendo en el puerto correcto

### Error: "WebSocket connection failed"
- Verificar que `SOCKET_URL` esté configurado correctamente
- Verificar que el proxy esté configurado para WebSockets

### Error: "AI service not working"
- Verificar que las API keys estén configuradas
- Verificar que las variables de entorno estén disponibles en el build
