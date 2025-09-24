const express = require('express');
const User = require('../models/User');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    
    console.log('📝 Registration attempt:', { username, email });
    
    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Validar confirmación de contraseña
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match',
        code: 'PASSWORD_MISMATCH'
      });
    }
    
    // Validaciones de formato
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ 
        error: 'Username must be between 3 and 50 characters',
        code: 'INVALID_USERNAME_LENGTH'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long',
        code: 'PASSWORD_TOO_SHORT'
      });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }
    
    // Crear usuario
    const user = await User.create({ username, email, password });
    
    console.log('✅ User created successfully:', user.id);
    
    // Generar JWT
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });
    
    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      token
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    
    // Errores conocidos
    if (error.message.includes('Email already registered')) {
      return res.status(409).json({ 
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }
    
    if (error.message.includes('Username already taken')) {
      return res.status(409).json({ 
        error: 'Username already taken',
        code: 'USERNAME_EXISTS'
      });
    }
    
    // Error genérico
    res.status(500).json({ 
      error: 'Registration failed. Please try again.',
      code: 'REGISTRATION_FAILED'
    });
  }
});

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔑 Login attempt for:', email);
    
    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Buscar usuario
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Validar contraseña
    const isValidPassword = await User.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    console.log('✅ Login successful for:', user.username);
    
    // Generar JWT
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });
    
    // Obtener estadísticas del usuario
    const stats = await User.getUserStats(user.id);
    
    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        stats
      },
      token
    });
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ 
      error: 'Login failed. Please try again.',
      code: 'LOGIN_FAILED'
    });
  }
});

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Obtener estadísticas
    const stats = await User.getUserStats(user.id);
    
    res.json({
      success: true,
      user: {
        ...user,
        stats
      }
    });
    
  } catch (error) {
    console.error('❌ Profile error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get profile',
      code: 'PROFILE_FAILED'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verificar token JWT
 */
router.post('/verify', authMiddleware, (req, res) => {
  res.json({ 
    success: true,
    valid: true, 
    user: {
      id: req.user.userId,
      username: req.user.username,
      email: req.user.email
    },
    token_info: {
      issued_at: new Date(req.user.iat * 1000),
      expires_at: new Date(req.user.exp * 1000)
    }
  });
});

/**
 * PUT /api/auth/profile
 * Actualizar perfil del usuario
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;
    const updateData = {};
    
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update',
        code: 'NO_UPDATE_FIELDS'
      });
    }
    
    const updatedUser = await User.update(req.user.userId, updateData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Profile update error:', error.message);
    
    if (error.message.includes('Email already registered')) {
      return res.status(409).json({ 
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }
    
    if (error.message.includes('Username already taken')) {
      return res.status(409).json({ 
        error: 'Username already taken',
        code: 'USERNAME_EXISTS'
      });
    }
    
    res.status(500).json({ 
      error: 'Profile update failed',
      code: 'UPDATE_FAILED'
    });
  }
});

module.exports = router;