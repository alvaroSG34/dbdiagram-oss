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
      return next(new Error('Authentication token required'));
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
    next(new Error('Invalid authentication token'));
  }
}

module.exports = {
  authenticateSocket
};