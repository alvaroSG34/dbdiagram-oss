const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT
 * Verifica el token en el header Authorization
 */
const authMiddleware = (req, res, next) => {
  try {
    // Extraer token del header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided',
        code: 'NO_TOKEN'
      });
    }

    // El token debe venir en formato "Bearer TOKEN"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token format',
        code: 'INVALID_FORMAT'
      });
    }
    
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del usuario a la request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // Error genérico
    res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware opcional de autenticación
 * Si hay token lo verifica, si no, continúa sin usuario
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    next();
  } catch (error) {
    // En caso de error, continuar sin usuario
    req.user = null;
    next();
  }
};

/**
 * Generar JWT token
 * @param {Object} payload - Datos a incluir en el token
 * @returns {string} - JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

/**
 * Verificar JWT token
 * @param {string} token - Token a verificar
 * @returns {Object} - Payload decodificado
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  generateToken,
  verifyToken
};