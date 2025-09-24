const db = require('../config/database');

class Room {
  /**
   * Generar un código único para la sala
   * @returns {string} - Código de 8 caracteres
   */
  static generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Crear una nueva sala
   * @param {Object} roomData - Datos de la sala
   * @param {string} roomData.name - Nombre de la sala
   * @param {string} roomData.description - Descripción (opcional)
   * @param {number} roomData.creator_id - ID del usuario creador
   * @param {boolean} roomData.is_public - Si es pública o privada
   * @param {number} roomData.max_members - Máximo miembros (default 5)
   * @returns {Promise<Object>} - Sala creada con código
   */
  static async create({ name, description, creator_id, is_public = false, max_members = 5 }) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validaciones
      if (!name || !creator_id) {
        throw new Error('Room name and creator_id are required');
      }

      if (name.length < 1 || name.length > 100) {
        throw new Error('Room name must be between 1 and 100 characters');
      }

      if (max_members < 1 || max_members > 10) {
        throw new Error('max_members must be between 1 and 10');
      }

      // Generar código único
      let room_code;
      let attempts = 0;
      do {
        room_code = this.generateRoomCode();
        attempts++;
        if (attempts > 10) {
          throw new Error('Failed to generate unique room code');
        }
      } while (await this.findByCode(room_code));

      // Crear sala
      const roomQuery = `
        INSERT INTO rooms (name, description, room_code, creator_id, is_public, max_members)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const roomResult = await client.query(roomQuery, [
        name.trim(),
        description?.trim() || null,
        room_code,
        creator_id,
        is_public,
        max_members
      ]);

      const room = roomResult.rows[0];

      // Agregar creador como owner de la sala
      const memberQuery = `
        INSERT INTO room_members (room_id, user_id, role)
        VALUES ($1, $2, 'owner')
      `;
      
      await client.query(memberQuery, [room.id, creator_id]);

      await client.query('COMMIT');

      console.log(`✅ Room created: ${room.name} (${room_code}) by user ${creator_id}`);
      
      return {
        ...room,
        member_count: 1,
        user_role: 'owner'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error.code === '23505' && error.detail.includes('room_code')) {
        // Código duplicado, intentar de nuevo
        return await this.create({ name, description, creator_id, is_public, max_members });
      }
      
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Buscar sala por código
   * @param {string} room_code - Código de la sala
   * @returns {Promise<Object|null>} - Sala encontrada
   */
  static async findByCode(room_code) {
    try {
      const query = `
        SELECT 
          r.*,
          u.username as creator_username,
          COUNT(rm.id) as member_count
        FROM rooms r
        LEFT JOIN users u ON r.creator_id = u.id
        LEFT JOIN room_members rm ON r.id = rm.room_id
        WHERE r.room_code = $1
        GROUP BY r.id, u.username
      `;
      
      const result = await db.query(query, [room_code.toUpperCase()]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding room by code:', error);
      throw error;
    }
  }

  /**
   * Buscar sala por ID
   * @param {number} room_id - ID de la sala
   * @returns {Promise<Object|null>} - Sala encontrada
   */
  static async findById(room_id) {
    try {
      const query = `
        SELECT 
          r.*,
          u.username as creator_username,
          COUNT(rm.id) as member_count
        FROM rooms r
        LEFT JOIN users u ON r.creator_id = u.id
        LEFT JOIN room_members rm ON r.id = rm.room_id
        WHERE r.id = $1
        GROUP BY r.id, u.username
      `;
      
      const result = await db.query(query, [room_id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding room by ID:', error);
      throw error;
    }
  }

  /**
   * Obtener salas de un usuario
   * @param {number} user_id - ID del usuario
   * @returns {Promise<Array>} - Lista de salas del usuario
   */
  static async getUserRooms(user_id) {
    try {
      const query = `
        SELECT 
          r.*,
          u.username as creator_username,
          rm.role as user_role,
          rm.joined_at,
          COUNT(all_members.id) as member_count
        FROM rooms r
        INNER JOIN room_members rm ON r.id = rm.room_id
        LEFT JOIN users u ON r.creator_id = u.id
        LEFT JOIN room_members all_members ON r.id = all_members.room_id
        WHERE rm.user_id = $1
        GROUP BY r.id, u.username, rm.role, rm.joined_at
        ORDER BY rm.joined_at DESC
      `;
      
      const result = await db.query(query, [user_id]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user rooms:', error);
      throw error;
    }
  }

  /**
   * Unirse a una sala
   * @param {string} room_code - Código de la sala
   * @param {number} user_id - ID del usuario
   * @returns {Promise<Object>} - Información de la sala
   */
  static async joinRoom(room_code, user_id) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar sala
      const room = await this.findByCode(room_code);
      if (!room) {
        throw new Error('Room not found');
      }

      // Verificar si ya es miembro
      const memberCheckQuery = `
        SELECT id, role FROM room_members 
        WHERE room_id = $1 AND user_id = $2
      `;
      
      const memberCheck = await client.query(memberCheckQuery, [room.id, user_id]);
      
      if (memberCheck.rows.length > 0) {
        throw new Error('User is already a member of this room');
      }

      // Verificar límite de miembros
      if (parseInt(room.member_count) >= room.max_members) {
        throw new Error(`Room is full (max ${room.max_members} members)`);
      }

      // Agregar usuario como member
      const addMemberQuery = `
        INSERT INTO room_members (room_id, user_id, role)
        VALUES ($1, $2, 'member')
        RETURNING joined_at
      `;
      
      const memberResult = await client.query(addMemberQuery, [room.id, user_id]);

      await client.query('COMMIT');

      console.log(`✅ User ${user_id} joined room ${room_code}`);

      return {
        ...room,
        user_role: 'member',
        joined_at: memberResult.rows[0].joined_at,
        member_count: parseInt(room.member_count) + 1
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verificar si un usuario tiene acceso a una sala
   * @param {number} room_id - ID de la sala
   * @param {number} user_id - ID del usuario
   * @returns {Promise<Object|null>} - Información de membresía o null
   */
  static async checkUserAccess(room_id, user_id) {
    try {
      const query = `
        SELECT rm.role, rm.joined_at, r.room_code, r.name as room_name
        FROM room_members rm
        INNER JOIN rooms r ON rm.room_id = r.id
        WHERE rm.room_id = $1 AND rm.user_id = $2
      `;
      
      const result = await db.query(query, [room_id, user_id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error checking user access:', error);
      throw error;
    }
  }

  /**
   * Obtener miembros de una sala
   * @param {number} room_id - ID de la sala
   * @returns {Promise<Array>} - Lista de miembros
   */
  static async getRoomMembers(room_id) {
    try {
      const query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          rm.role,
          rm.joined_at
        FROM room_members rm
        INNER JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = $1
        ORDER BY rm.role DESC, rm.joined_at ASC
      `;
      
      const result = await db.query(query, [room_id]);
      return result.rows;
    } catch (error) {
      console.error('Error getting room members:', error);
      throw error;
    }
  }

  /**
   * Actualizar contenido DBML de la sala
   * @param {number} room_id - ID de la sala
   * @param {string} dbml_content - Contenido DBML
   * @returns {Promise<Object>} - Sala actualizada
   */
  static async updateContent(room_id, dbml_content) {
    try {
      const query = `
        UPDATE rooms 
        SET dbml_content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await db.query(query, [dbml_content, room_id]);
      
      if (result.rows.length === 0) {
        throw new Error('Room not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating room content:', error);
      throw error;
    }
  }

  /**
   * Eliminar sala (solo owner)
   * @param {number} room_id - ID de la sala
   * @param {number} user_id - ID del usuario (debe ser owner)
   * @returns {Promise<boolean>} - True si se eliminó
   */
  static async deleteRoom(room_id, user_id) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar que sea el owner
      const ownerCheck = await client.query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2 AND role = $3',
        [room_id, user_id, 'owner']
      );

      if (ownerCheck.rows.length === 0) {
        throw new Error('Only room owner can delete the room');
      }

      // Eliminar sala (cascade eliminará members automáticamente)
      const deleteResult = await client.query(
        'DELETE FROM rooms WHERE id = $1 RETURNING room_code, name',
        [room_id]
      );

      await client.query('COMMIT');

      if (deleteResult.rows.length > 0) {
        const deletedRoom = deleteResult.rows[0];
        console.log(`✅ Room deleted: ${deletedRoom.name} (${deletedRoom.room_code})`);
        return true;
      }

      return false;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Abandonar sala (member) o transferir ownership y salir (owner)
   * @param {number} room_id - ID de la sala
   * @param {number} user_id - ID del usuario
   * @returns {Promise<boolean>} - True si salió exitosamente
   */
  static async leaveRoom(room_id, user_id) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar membresía
      const memberCheck = await client.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [room_id, user_id]
      );

      if (memberCheck.rows.length === 0) {
        throw new Error('User is not a member of this room');
      }

      const userRole = memberCheck.rows[0].role;

      if (userRole === 'owner') {
        // Si es owner, buscar otro miembro para transferir ownership
        const otherMembers = await client.query(
          'SELECT user_id FROM room_members WHERE room_id = $1 AND user_id != $2 AND role = $3 ORDER BY joined_at ASC',
          [room_id, user_id, 'member']
        );

        if (otherMembers.rows.length > 0) {
          // Transferir ownership al miembro más antiguo
          const newOwner = otherMembers.rows[0].user_id;
          await client.query(
            'UPDATE room_members SET role = $1 WHERE room_id = $2 AND user_id = $3',
            ['owner', room_id, newOwner]
          );
          
          console.log(`✅ Ownership transferred to user ${newOwner} in room ${room_id}`);
        }
        // Si no hay otros miembros, la sala se eliminará automáticamente por CASCADE
      }

      // Remover al usuario
      const removeResult = await client.query(
        'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2 RETURNING id',
        [room_id, user_id]
      );

      await client.query('COMMIT');

      console.log(`✅ User ${user_id} left room ${room_id}`);
      return removeResult.rows.length > 0;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Room;