# Fase 1: Sistema de Autenticación - Instrucciones de Setup

## 📋 Requisitos Previos

- PostgreSQL instalado y funcionando
- pgAdmin (opcional, para gestión visual)
- Node.js v16+ y npm

## 🚀 Pasos de Configuración

### 1. Configurar PostgreSQL

```bash
# 1. Abrir pgAdmin
# 2. Crear nueva base de datos: "dbdiagram_app"
# 3. Ejecutar el archivo: api/database/schema.sql
```

### 2. Configurar Variables de Entorno

Editar el archivo `api/.env`:

```env
# Database Configuration - PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dbdiagram_app
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña_postgres

# JWT Configuration
JWT_SECRET=tu_clave_secreta_jwt_muy_larga_y_segura_12345
JWT_EXPIRES_IN=24h

# Server Configuration
AUTH_PORT=3002
SOCKET_PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:8080
```

### 3. Instalar Dependencias

```bash
cd api
npm install
```

### 4. Ejecutar el Servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

### 5. Verificar Funcionamiento

#### Health Check
```bash
curl http://localhost:3002/api/health
```

#### Registro de Usuario
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📊 Estructura de Base de Datos

### Tabla: users
- `id` - SERIAL PRIMARY KEY
- `username` - VARCHAR(50) UNIQUE
- `email` - VARCHAR(100) UNIQUE
- `password_hash` - VARCHAR(255)
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

### Tabla: rooms (preparada para Fase 2)
- `id` - SERIAL PRIMARY KEY
- `name` - VARCHAR(100)
- `room_code` - VARCHAR(8) UNIQUE
- `creator_id` - INTEGER (FK to users)
- `dbml_content` - TEXT
- `max_members` - INTEGER (default 5)

### Tabla: room_members (preparada para Fase 2)
- `id` - SERIAL PRIMARY KEY
- `room_id` - INTEGER (FK to rooms)
- `user_id` - INTEGER (FK to users)
- `role` - VARCHAR(20) ('owner' | 'member')

## 🔐 Endpoints Disponibles

### Públicos
- `GET /api/health` - Health check
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario

### Protegidos (requieren JWT)
- `GET /api/auth/profile` - Perfil del usuario
- `POST /api/auth/verify` - Verificar token
- `PUT /api/auth/profile` - Actualizar perfil

## 🧪 Script de Prueba

```bash
# En Linux/Mac
chmod +x test-auth.sh
./test-auth.sh

# En Windows (PowerShell)
# Ejecutar comandos curl manualmente o usar Postman
```

## 📝 Logs del Servidor

El servidor mostrará:
- ✅ Conexión a base de datos exitosa
- 📝 Intentos de registro/login
- ❌ Errores de validación
- 🔐 Información de tokens JWT

## 🔧 Troubleshooting

### Error: "Database connection failed"
1. Verificar que PostgreSQL esté ejecutándose
2. Comprobar credenciales en `.env`
3. Verificar que la base de datos `dbdiagram_app` existe

### Error: "Port already in use"
1. Cambiar `AUTH_PORT` en `.env`
2. O matar proceso: `lsof -ti:3002 | xargs kill -9`

### Error: JWT_SECRET
1. Asegurarse de que `JWT_SECRET` esté configurado en `.env`
2. Usar una clave de al menos 32 caracteres

## ✅ Fase 1 Completada Cuando:

- [ ] Servidor inicia sin errores
- [ ] Health check responde OK
- [ ] Registro de usuario funciona
- [ ] Login devuelve JWT válido
- [ ] Rutas protegidas requieren autenticación
- [ ] Tokens se validan correctamente

## 🚀 Siguiente: Fase 2

Una vez que Fase 1 funcione correctamente, procederemos con:
- Sistema de salas/rooms
- Creación e invitación de salas
- Dashboard de usuario
- Frontend de autenticación