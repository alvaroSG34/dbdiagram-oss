const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.username - Nombre de usuario
   * @param {string} userData.email - Email del usuario
   * @param {string} userData.password - Contraseña en texto plano
   * @returns {Promise<Object>} - Usuario creado (sin password_hash)
   */
  static async create({ username, email, password }) {
    try {
      // Validaciones básicas
      if (!username || !email || !password) {
        throw new Error('Username, email, and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Hash de la contraseña
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);
      
      const query = `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at, updated_at
      `;
      
      const result = await db.query(query, [username.trim(), email.trim().toLowerCase(), password_hash]);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create user');
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.detail.includes('email')) {
          throw new Error('Email already registered');
        }
        if (error.detail.includes('username')) {
          throw new Error('Username already taken');
        }
      }
      throw error;
    }
  }
  
  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} - Usuario completo (con password_hash)
   */
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await db.query(query, [email.trim().toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }
  
  /**
   * Buscar usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object|null>} - Usuario sin password_hash
   */
  static async findById(id) {
    try {
      const query = `
        SELECT id, username, email, created_at, updated_at 
        FROM users 
        WHERE id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }
  
  /**
   * Validar contraseña
   * @param {string} plainPassword - Contraseña en texto plano
   * @param {string} hashedPassword - Hash de la contraseña almacenada
   * @returns {Promise<boolean>} - True si la contraseña es correcta
   */
  static async validatePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error validating password:', error);
      throw error;
    }
  }
  
  /**
   * Verificar si un email ya existe
   * @param {string} email - Email a verificar
   * @returns {Promise<boolean>} - True si el email existe
   */
  static async emailExists(email) {
    try {
      const query = 'SELECT id FROM users WHERE email = $1';
      const result = await db.query(query, [email.trim().toLowerCase()]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }
  
  /**
   * Verificar si un username ya existe
   * @param {string} username - Username a verificar
   * @returns {Promise<boolean>} - True si el username existe
   */
  static async usernameExists(username) {
    try {
      const query = 'SELECT id FROM users WHERE username = $1';
      const result = await db.query(query, [username.trim()]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking username existence:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Estadísticas del usuario
   */
  static async getUserStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN rm.role = 'owner' THEN 1 END) as rooms_owned,
          COUNT(CASE WHEN rm.role = 'member' THEN 1 END) as rooms_joined,
          COUNT(rm.id) as total_rooms
        FROM room_members rm
        WHERE rm.user_id = $1
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows[0] || { rooms_owned: 0, rooms_joined: 0, total_rooms: 0 };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Actualizar información del usuario
   * @param {number} userId - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Usuario actualizado
   */
  static async update(userId, updateData) {
    try {
      const allowedFields = ['username', 'email'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      for (const [field, value] of Object.entries(updateData)) {
        if (allowedFields.includes(field) && value !== undefined) {
          updates.push(`${field} = $${paramCount++}`);
          values.push(field === 'email' ? value.trim().toLowerCase() : value.trim());
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(userId);
      
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, username, email, created_at, updated_at
      `;

      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.detail.includes('email')) {
          throw new Error('Email already registered');
        }
        if (error.detail.includes('username')) {
          throw new Error('Username already taken');
        }
      }
      throw error;
    }
  }
}

module.exports = User;