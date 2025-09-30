const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

// Importar configuración de base de datos para probar conexión
const db = require('./config/database');

// Importar middleware de autenticación de socket
const { authenticateSocket } = require('./middleware/socketAuth');
const Room = require('./models/Room');

const app = express();
const server = http.createServer(app);

// ================================================
// MIDDLEWARE DE SEGURIDAD
// ================================================

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL] 
      : [
          'http://localhost:8080', 
          'http://localhost:9000', 
          'http://127.0.0.1:8080',
          'http://localhost:3001',  // WebSocket server
          'http://127.0.0.1:3001',  // WebSocket server alternate
          'http://localhost:3210',  // Vue.js frontend
          'http://127.0.0.1:3210'   // Vue.js frontend alternate
        ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// ================================================
// SOCKET.IO CONFIGURATION
// ================================================

// Inicializar Socket.IO en el servidor
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL] 
      : [
          'http://localhost:8080', 
          'http://localhost:9000', 
          'http://127.0.0.1:8080',
          'http://localhost:3001',
          'http://127.0.0.1:3001',
          'http://localhost:3210',
          'http://127.0.0.1:3210'
        ],
    methods: ['GET', 'POST']
  }
});

// Aplicar middleware de autenticación
io.use(authenticateSocket);

// Gestión de salas activas
const activeRooms = new Map(); // room_code -> { users: Map<userId, socketInfo>, roomData: {...} }

// Manejar conexiones de clientes autenticados
io.on('connection', (socket) => {
  console.log(`\n🎉 === NUEVA CONEXIÓN WEBSOCKET ===`);
  console.log(`✅ Usuario autenticado conectado: ${socket.username} (${socket.userId})`);
  console.log(`🔌 Socket ID: ${socket.id}`);
  console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
  console.log(`====================================\n`);

  // Unirse a una sala específica
  socket.on('join-room', async (data) => {
    try {
      console.log(`📥 [SERVER] Datos recibidos en join-room:`, data);
      const { room_code, room_password } = data;
      
      console.log(`🚪 ${socket.username} intentando unirse a la sala: ${room_code}`);

      // Primero buscar la sala para obtener su ID
      console.log(`🔍 [SERVER] Buscando sala con código: ${room_code}`);
      const room = await Room.findByCode(room_code);
      
      if (!room) {
        console.log(`❌ [SERVER] Sala ${room_code} no encontrada en la base de datos`);
        return socket.emit('join-room-error', {
          error: 'Sala no encontrada',
          code: 'ROOM_NOT_FOUND'
        });
      }
      
      console.log(`✅ [SERVER] Sala encontrada:`, {
        id: room.id,
        name: room.name,
        description: room.description,
        dbml_content: room.dbml_content ? 'Sí tiene contenido' : 'Sin contenido'
      });

      // Verificar si el usuario ya tiene acceso a la sala
      console.log(`🔐 [SERVER] Verificando acceso del usuario ${socket.userId} a la sala ${room.id}`);
      let roomAccess = await Room.checkUserAccess(room.id, socket.userId);
      
      console.log(`🔑 [SERVER] Resultado de acceso:`, roomAccess);
      
      if (!roomAccess) {
        // Si no tiene acceso directo, intentar unirse con el código/contraseña
        try {
          await Room.joinRoom(room_code.toUpperCase(), socket.userId);
          console.log(`🎉 ${socket.username} se unió exitosamente a la sala ${room_code}`);
          
          // Obtener el acceso después de unirse
          roomAccess = await Room.checkUserAccess(room.id, socket.userId);
        } catch (joinError) {
          return socket.emit('join-room-error', {
            error: joinError.message,
            code: 'JOIN_FAILED'
          });
        }
      }

      // Unirse al room de Socket.IO
      socket.join(room_code);
      socket.currentRoom = room_code;

      // Inicializar sala activa si es necesaria
      if (!activeRooms.has(room_code)) {
        activeRooms.set(room_code, {
          users: new Map(),
          roomData: room,
          lastUpdate: new Date()
        });
      }

      const roomInfo = activeRooms.get(room_code);
      
      // Agregar usuario a la sala activa
      roomInfo.users.set(socket.userId, {
        socketId: socket.id,
        username: socket.username,
        userId: socket.userId,
        joinedAt: new Date(),
        role: roomAccess.role || 'member'
      });

      // Obtener lista de usuarios conectados
      const connectedUsers = Array.from(roomInfo.users.values()).map(user => ({
        userId: user.userId,
        username: user.username,
        role: user.role,
        joinedAt: user.joinedAt
      }));

      // Confirmar al usuario que se unió exitosamente
      socket.emit('room-joined', {
        success: true,
        room: {
          code: room_code,
          name: roomInfo.roomData.name,
          description: roomInfo.roomData.description,
          connectedUsers: connectedUsers,
          currentContent: roomInfo.roomData.dbml_content || '',
          userRole: roomInfo.users.get(socket.userId).role
        }
      });

      // Notificar a otros usuarios sobre el nuevo participante
      socket.to(room_code).emit('user-joined-room', {
        user: {
          userId: socket.userId,
          username: socket.username,
          role: roomInfo.users.get(socket.userId).role
        },
        totalUsers: connectedUsers.length
      });

      // Mostrar notificación popup a otros usuarios
      socket.to(room_code).emit('user-notification', {
        type: 'user-joined',
        message: `${socket.username} se unió a la sala`,
        username: socket.username,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ ${socket.username} conectado a sala ${room_code}. Total usuarios: ${connectedUsers.length}`);
      console.log(`🏠 [SERVER] socket.currentRoom establecido a: ${socket.currentRoom}`);
      console.log(`🗂️ [SERVER] Salas activas: ${Array.from(activeRooms.keys()).join(', ')}`);

    } catch (error) {
      console.error('❌ Error al unirse a la sala:', error.message);
      socket.emit('join-room-error', {
        error: 'No se pudo unir a la sala',
        code: 'ROOM_ACCESS_DENIED'
      });
    }
  });

  // Recibir y sincronizar cambios en el diagrama
  socket.on('diagram-update', async (data) => {
    try {
      console.log(`📥 Recibido diagram-update de ${socket.username}:`, data);
      const { room_code, updateType, payload, dbml_content } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== room_code) {
        return socket.emit('error', { message: 'No estás en esta sala' });
      }

      console.log(`📝 ${socket.username} actualizó el diagrama en sala ${room_code}: ${updateType}`);

      // Actualizar contenido en la sala activa
      if (activeRooms.has(room_code)) {
        const roomInfo = activeRooms.get(room_code);
        roomInfo.roomData.dbml_content = dbml_content || roomInfo.roomData.dbml_content;
        roomInfo.lastUpdate = new Date();

        // Guardar automáticamente en la base de datos
        if (dbml_content) {
          await Room.updateRoomContent(roomInfo.roomData.id, dbml_content);
          console.log(`💾 Contenido guardado automáticamente en sala ${room_code}`);
        }
      }

      // Retransmitir la actualización a todos los demás usuarios en la sala
      socket.to(room_code).emit('diagram-update', {
        userId: socket.userId,
        username: socket.username,
        updateType,
        payload,
        dbml_content,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error al actualizar diagrama:', error.message);
      socket.emit('error', { message: 'Error al guardar cambios' });
    }
  });

  // Manejar actualizaciones del estado del diagrama (zoom, pan, position)
  socket.on('diagram-state-update', async (data) => {
    try {
      const { room_code, updateType, payload } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== room_code) {
        return socket.emit('error', { message: 'No estás en esta sala' });
      }

      const { zoom, pan, position } = payload;
      console.log(`🎯 ${socket.username} actualizó estado del diagrama en sala ${room_code}: zoom=${zoom}, pan=[${pan.x}, ${pan.y}], position=[${position.x}, ${position.y}]`);

      // Retransmitir la actualización a todos los demás usuarios en la sala
      socket.to(room_code).emit('diagram-state-update', {
        userId: socket.userId,
        username: socket.username,
        updateType: 'diagram-state-update',
        payload,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error al actualizar estado del diagrama:', error.message);
      socket.emit('error', { message: 'Error al actualizar estado del diagrama' });
    }
  });

  // Manejar actualizaciones de tipos de relación UML - SIMPLIFICADO
  socket.on('relationship-type-update', async (data) => {
    try {
      const { room_code, relationshipChanges } = data;
      
      console.log(`🔗 SERVIDOR: Recibido relationship-type-update de ${socket.username}:`, {
        room_code, 
        relationshipChanges: {
          refId: relationshipChanges?.refId,
          relationType: relationshipChanges?.relationType,
          startCardinality: relationshipChanges?.startCardinality,
          endCardinality: relationshipChanges?.endCardinality,
          relationshipName: relationshipChanges?.relationshipName
        },
        socketRoom: socket.currentRoom,
        userId: socket.userId
      });
      
      if (!socket.currentRoom || socket.currentRoom !== room_code) {
        console.warn(`🔗 SERVIDOR: Usuario ${socket.username} no está en la sala ${room_code} (está en ${socket.currentRoom})`);
        return socket.emit('error', { message: 'No estás en esta sala' });
      }

      console.log(`🔗 SERVIDOR: ${socket.username} actualizó relación en sala ${room_code}:`, relationshipChanges);

      // Retransmitir la actualización a todos los demás usuarios en la sala
      const broadcastData = {
        userId: socket.userId,
        username: socket.username,
        relationshipChanges: relationshipChanges,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔗 SERVIDOR: Propagando relationship-type-update a otros usuarios en sala ${room_code}:`, broadcastData);
      socket.to(room_code).emit('relationship-type-update', broadcastData);

    } catch (error) {
      console.error('❌ Error al actualizar relación UML:', error.message);
      socket.emit('error', { message: 'Error al actualizar relación UML' });
    }
  });

  // Manejar actualizaciones de posición de tabla
  socket.on('table-position-update', async (data) => {
    try {
      console.log(`📥 [SERVER] Recibido table-position-update:`, data);
      const { room_code, updateType, payload } = data;
      
      console.log(`🔍 [SERVER] Verificando sala - Usuario en: ${socket.currentRoom}, Evento para: ${room_code}`);
      
      if (!socket.currentRoom || socket.currentRoom !== room_code) {
        console.log(`❌ [SERVER] Usuario no está en la sala correcta`);
        return socket.emit('error', { message: 'No estás en esta sala' });
      }

      const { tableId, position, isDragging } = payload;
      const dragStatus = isDragging ? '🔄 (arrastrando)' : '✅ (posición final)';
      
      // Log detallado con timestamp y información de sala
      console.log(`\n🔥 === MOVIMIENTO DE TABLA ===`);
      console.log(`📦 Usuario: ${socket.username} (ID: ${socket.userId})`);
      console.log(`🏠 Sala: ${room_code}`);
      console.log(`🆔 Tabla ID: ${tableId}`);
      console.log(`📍 Posición: x=${position.x}, y=${position.y}`);
      console.log(`⚡ Estado: ${dragStatus}`);
      console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
      
      // Obtener información de usuarios conectados
      if (activeRooms.has(room_code)) {
        const roomInfo = activeRooms.get(room_code);
        const connectedUsers = Array.from(roomInfo.users.values()).map(u => u.username);
        console.log(`👥 Usuarios conectados (${connectedUsers.length}): ${connectedUsers.join(', ')}`);
        console.log(`📡 Propagando a ${connectedUsers.length - 1} usuarios...`);
      }
      console.log(`================================\n`);

      // Retransmitir la actualización a todos los demás usuarios en la sala
      socket.to(room_code).emit('table-position-update', {
        userId: socket.userId,
        username: socket.username,
        updateType: 'table-position-update',
        payload,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ [SERVER] Evento table-position-update propagado exitosamente`);

    } catch (error) {
      console.error('❌ Error al actualizar posición de tabla:', error.message);
      socket.emit('error', { message: 'Error al actualizar posición de tabla' });
    }
  });

  // Manejar actualizaciones de posición de grupo de tablas
  socket.on('tablegroup-position-update', async (data) => {
    try {
      const { room_code, updateType, payload } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== room_code) {
        return socket.emit('error', { message: 'No estás en esta sala' });
      }

      const { groupId, position, isDragging } = payload;
      const dragStatus = isDragging ? '🔄 (arrastrando)' : '✅ (posición final)';
      
      // Log detallado para grupos de tablas
      console.log(`\n🔥 === MOVIMIENTO DE GRUPO DE TABLAS ===`);
      console.log(`📦🔗 Usuario: ${socket.username} (ID: ${socket.userId})`);
      console.log(`🏠 Sala: ${room_code}`);
      console.log(`🆔 Grupo ID: ${groupId}`);
      console.log(`📍 Posición: x=${position.x}, y=${position.y}`);
      console.log(`⚡ Estado: ${dragStatus}`);
      console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
      
      // Obtener información de usuarios conectados
      if (activeRooms.has(room_code)) {
        const roomInfo = activeRooms.get(room_code);
        const connectedUsers = Array.from(roomInfo.users.values()).map(u => u.username);
        console.log(`👥 Usuarios conectados (${connectedUsers.length}): ${connectedUsers.join(', ')}`);
        console.log(`📡 Propagando a ${connectedUsers.length - 1} usuarios...`);
      }
      console.log(`===========================================\n`);

      // Retransmitir la actualización a todos los demás usuarios en la sala
      socket.to(room_code).emit('tablegroup-position-update', {
        userId: socket.userId,
        username: socket.username,
        updateType: 'tablegroup-position-update',
        payload,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error al actualizar posición de grupo:', error.message);
      socket.emit('error', { message: 'Error al actualizar posición de grupo' });
    }
  });

  // Expulsar usuario (solo owner)
  socket.on('kick-user', async (data) => {
    try {
      const { room_code, target_user_id } = data;
      
      if (!activeRooms.has(room_code)) {
        return socket.emit('error', { message: 'Sala no encontrada' });
      }

      const roomInfo = activeRooms.get(room_code);
      const currentUser = roomInfo.users.get(socket.userId);

      // Verificar que el usuario actual es owner
      if (!currentUser || currentUser.role !== 'owner') {
        return socket.emit('error', { message: 'Solo el owner puede expulsar usuarios' });
      }

      // Encontrar el socket del usuario a expulsar
      const targetUser = roomInfo.users.get(target_user_id);
      if (!targetUser) {
        return socket.emit('error', { message: 'Usuario no encontrado en la sala' });
      }

      // Remover usuario de la base de datos
      await Room.leaveRoom(roomInfo.roomData.id, target_user_id);

      // Expulsar del socket
      const targetSocket = io.sockets.sockets.get(targetUser.socketId);
      if (targetSocket) {
        targetSocket.emit('kicked-from-room', {
          room_code,
          message: `Fuiste expulsado de la sala por ${socket.username}`
        });
        targetSocket.leave(room_code);
        targetSocket.currentRoom = null;
      }

      // Remover de usuarios activos
      roomInfo.users.delete(target_user_id);

      // Notificar a todos en la sala
      socket.to(room_code).emit('user-kicked', {
        kicked_user: {
          userId: target_user_id,
          username: targetUser.username
        },
        kicked_by: socket.username
      });

      socket.emit('user-kicked-success', {
        message: `${targetUser.username} fue expulsado de la sala`
      });

      console.log(`👢 ${socket.username} expulsó a ${targetUser.username} de la sala ${room_code}`);

    } catch (error) {
      console.error('❌ Error al expulsar usuario:', error.message);
      socket.emit('error', { message: 'Error al expulsar usuario' });
    }
  });

  // Manejar desconexiones
  socket.on('disconnect', () => {
    console.log(`❌ Usuario desconectado: ${socket.username} (${socket.userId})`);
    
    if (socket.currentRoom && activeRooms.has(socket.currentRoom)) {
      const roomInfo = activeRooms.get(socket.currentRoom);
      const user = roomInfo.users.get(socket.userId);
      
      if (user) {
        // Remover usuario de la sala activa
        roomInfo.users.delete(socket.userId);

        // Notificar a otros usuarios
        socket.to(socket.currentRoom).emit('user-left-room', {
          user: {
            userId: socket.userId,
            username: socket.username
          },
          totalUsers: roomInfo.users.size
        });

        // Mostrar notificación popup
        socket.to(socket.currentRoom).emit('user-notification', {
          type: 'user-left',
          message: `${socket.username} salió de la sala`,
          username: socket.username,
          timestamp: new Date().toISOString()
        });

        console.log(`🚪 ${socket.username} salió de la sala ${socket.currentRoom}. Usuarios restantes: ${roomInfo.users.size}`);

        // Limpiar salas vacías
        if (roomInfo.users.size === 0) {
          activeRooms.delete(socket.currentRoom);
          console.log(`🧹 Sala ${socket.currentRoom} cerrada - sin usuarios activos`);
        }
      }
    }
  });
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================================================
// RATE LIMITING
// ================================================

// Rate limiting para autenticación (más permisivo en desarrollo)
const authLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000, // 15 min en prod, 5 min en dev
  max: process.env.NODE_ENV === 'production' ? 10 : 50, // 10 en prod, 50 en dev
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retry_after: process.env.NODE_ENV === 'production' ? '15 minutes' : '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting general (más permisivo en desarrollo)
const generalLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000, // 15 min en prod, 5 min en dev
  max: process.env.NODE_ENV === 'production' ? 100 : 200, // 100 en prod, 200 en dev
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// ================================================
// LOGGING MIDDLEWARE
// ================================================

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// ================================================
// RUTAS
// ================================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Probar conexión a base de datos
    await db.query('SELECT 1');
    
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(503).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// Auth routes con rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Room routes con rate limiting general
app.use('/api/rooms', generalLimiter, roomRoutes);

// ================================================
// ERROR HANDLING
// ================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    available_endpoints: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'POST /api/auth/verify',
      'PUT /api/auth/profile',
      'POST /api/rooms',
      'POST /api/rooms/join',
      'GET /api/rooms',
      'GET /api/rooms/:room_code',
      'PUT /api/rooms/:room_code/content',
      'DELETE /api/rooms/:room_code/leave',
      'DELETE /api/rooms/:room_code',
      'GET /api/rooms/:room_code/members'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  // CORS Error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
  }
  
  // Validation errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON format',
      code: 'INVALID_JSON'
    });
  }
  
  // Generic error
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ================================================
// SERVER STARTUP
// ================================================

const PORT = process.env.PORT || 3002;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Test database connection before starting server
const startServer = async () => {
  try {
    console.log('🔌 Testing database connection...');
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    
    server.listen(PORT, '0.0.0.0', () => { // Agregado '0.0.0.0'
      console.log('🚀 ========================================');
      console.log(`🔐 Auth Server running on port ${PORT}`);
      console.log(`📡 WebSocket Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log('🚀 ========================================');
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.error('💡 Please check your .env file and database configuration');
    process.exit(1);
  }
};

startServer();

module.exports = app;