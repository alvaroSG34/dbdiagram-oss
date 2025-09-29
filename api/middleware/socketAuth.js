const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware de autenticación para WebSocket
 * @param {Object} socket - Socket de conexión
 * @param {Function} next - Función para continuar
 */
function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // Modo desarrollo: permitir conexiones sin token con usuario mock
      console.log('⚠️ No token provided, using mock user for development');
      socket.userId = 'dev-user-' + Math.random().toString(36).substr(2, 9);
      socket.username = 'Usuario Desarrollo';
      socket.email = 'dev@example.com';
      console.log(`🔐 WebSocket authenticated (mock): ${socket.username} (${socket.userId})`);
      return next();
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del usuario al socket
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    socket.email = decoded.email;
    
    console.log(`🔐 WebSocket authenticated: ${socket.username} (${socket.userId})`);
    next();
    
  } catch (error) {
    console.error('❌ WebSocket authentication failed:', error.message);
    // En desarrollo, usar usuario mock si el token es inválido
    console.log('⚠️ Token invalid, using mock user for development');
    socket.userId = 'dev-user-' + Math.random().toString(36).substr(2, 9);
    socket.username = 'Usuario Desarrollo';
    socket.email = 'dev@example.com';
    console.log(`🔐 WebSocket authenticated (mock): ${socket.username} (${socket.userId})`);
    next();
  }
}

module.exports = {
  authenticateSocket
};