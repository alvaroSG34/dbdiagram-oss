const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');

// Importar configuración de base de datos para probar conexión
const db = require('./config/database');

const app = express();

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
      : ['http://localhost:8080', 'http://localhost:9000', 'http://127.0.0.1:8080'];
    
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================================================
// RATE LIMITING
// ================================================

// Rate limiting para autenticación (más restrictivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retry_after: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
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
      'PUT /api/auth/profile'
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

const PORT = process.env.AUTH_PORT || 3002;

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
    
    app.listen(PORT, () => {
      console.log('🚀 ========================================');
      console.log(`🔐 Auth Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
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