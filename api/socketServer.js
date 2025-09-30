const http = require('http');
const { Server } = require('socket.io');
const { authenticateSocket } = require('./middleware/socketAuth');
const Room = require('./models/Room');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Crear un servidor HTTP básico
const server = http.createServer((req, res) => {
  // Servir archivo de prueba
  if (req.url === '/test' || req.url === '/') {
    const filePath = path.join(__dirname, 'test-websocket.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Error loading test page');
      } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
      }
    });
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not found');
  }
});

// Inicializar Socket.IO en el servidor
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
      : [
          'http://localhost:8080', 
          'http://localhost:9000', 
          'http://127.0.0.1:8080',
          'http://localhost:3001',
          'http://127.0.0.1:3001',
          'http://localhost:3210',
          'http://127.0.0.1:3210',
          'https://dbdiagram-ashy.vercel.app',
          'https://dbdiagram-oss.vercel.app'
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

// Iniciar el servidor en el puerto configurado
const SOCKET_PORT = process.env.SOCKET_PORT || 3001;

server.listen(SOCKET_PORT, '0.0.0.0', () => {
  console.log('🚀 ========================================');
  console.log(`📡 WebSocket Server running on port ${SOCKET_PORT}`);
  console.log('🏠 Room-based collaboration enabled');
  console.log('🔐 Authentication required');
  console.log(`🌍 Server: http://0.0.0.0:${SOCKET_PORT}`);
  console.log(`🧪 Test page: http://localhost:${SOCKET_PORT}/test`);
  console.log('🚀 ========================================');
  
  // Mostrar IP local para facilitar la configuración
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  console.log('\n--- Network Interfaces ---');
  Object.keys(networkInterfaces).forEach(interface => {
    networkInterfaces[interface].forEach(network => {
      if (network.family === 'IPv4' && !network.internal) {
        console.log(`${interface}: http://${network.address}:${SOCKET_PORT}`);
        console.log(`  Test: http://${network.address}:${SOCKET_PORT}/test`);
      }
    });
  });
  console.log('--------------------------\n');
});
