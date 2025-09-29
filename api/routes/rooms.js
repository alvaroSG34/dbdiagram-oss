const express = require('express');
const Room = require('../models/Room');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/rooms
 * Crear una nueva sala
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, is_public, max_members } = req.body;
    const creator_id = req.user.userId;

    console.log(`📝 Creating room: ${name} by user ${creator_id}`);

    // Validaciones básicas
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Room name is required',
        code: 'MISSING_ROOM_NAME'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        error: 'Room name must be less than 100 characters',
        code: 'ROOM_NAME_TOO_LONG'
      });
    }

    // Crear sala
    const room = await Room.create({
      name,
      description,
      creator_id,
      is_public: is_public || false,
      max_members: max_members || 5
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        room_code: room.room_code,
        is_public: room.is_public,
        max_members: room.max_members,
        member_count: room.member_count,
        user_role: room.user_role,
        created_at: room.created_at
      }
    });

  } catch (error) {
    console.error('❌ Room creation error:', error.message);

    if (error.message.includes('Room name must be')) {
      return res.status(400).json({
        error: error.message,
        code: 'INVALID_ROOM_NAME'
      });
    }

    if (error.message.includes('max_members must be')) {
      return res.status(400).json({
        error: error.message,
        code: 'INVALID_MAX_MEMBERS'
      });
    }

    res.status(500).json({
      error: 'Failed to create room',
      code: 'ROOM_CREATION_FAILED'
    });
  }
});

/**
 * POST /api/rooms/join
 * Unirse a una sala existente
 */
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { room_code } = req.body;
    const user_id = req.user.userId;

    console.log(`🚪 User ${user_id} trying to join room: ${room_code}`);

    // Validaciones básicas
    if (!room_code || room_code.trim().length === 0) {
      return res.status(400).json({
        error: 'Room code is required',
        code: 'MISSING_ROOM_CODE'
      });
    }

    if (room_code.length !== 8) {
      return res.status(400).json({
        error: 'Room code must be 8 characters long',
        code: 'INVALID_ROOM_CODE_LENGTH'
      });
    }

    // Unirse a la sala
    const room = await Room.joinRoom(room_code.toUpperCase(), user_id);

    res.json({
      success: true,
      message: 'Successfully joined room',
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        room_code: room.room_code,
        is_public: room.is_public,
        max_members: room.max_members,
        member_count: room.member_count,
        user_role: room.user_role,
        creator_username: room.creator_username,
        joined_at: room.joined_at
      }
    });

  } catch (error) {
    console.error('❌ Join room error:', error.message);

    if (error.message === 'Room not found') {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }

    if (error.message === 'User is already a member of this room') {
      return res.status(409).json({
        error: 'You are already a member of this room',
        code: 'ALREADY_MEMBER'
      });
    }

    if (error.message.includes('Room is full')) {
      return res.status(409).json({
        error: error.message,
        code: 'ROOM_FULL'
      });
    }

    res.status(500).json({
      error: 'Failed to join room',
      code: 'JOIN_ROOM_FAILED'
    });
  }
});

/**
 * GET /api/rooms
 * Obtener todas las salas del usuario actual
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.userId;

    console.log(`📋 Getting rooms for user: ${user_id}`);

    const rooms = await Room.getUserRooms(user_id);

    res.json({
      success: true,
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        room_code: room.room_code,
        is_public: room.is_public,
        max_members: room.max_members,
        member_count: parseInt(room.member_count),
        user_role: room.user_role,
        creator_username: room.creator_username,
        joined_at: room.joined_at,
        created_at: room.created_at,
        updated_at: room.updated_at
      }))
    });

  } catch (error) {
    console.error('❌ Get rooms error:', error.message);
    res.status(500).json({
      error: 'Failed to get rooms',
      code: 'GET_ROOMS_FAILED'
    });
  }
});

/**
 * GET /api/rooms/:room_code
 * Obtener información de una sala específica
 */
router.get('/:room_code', authMiddleware, async (req, res) => {
  try {
    const { room_code } = req.params;
    const user_id = req.user.userId;

    console.log(`🔍 Getting room info: ${room_code} for user ${user_id}`);

    // Buscar sala
    const room = await Room.findByCode(room_code);
    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }

    // Verificar acceso del usuario
    const userAccess = await Room.checkUserAccess(room.id, user_id);
    
    // Si el usuario tiene acceso, devolver información completa
    if (userAccess) {
      // Obtener miembros
      const members = await Room.getRoomMembers(room.id);

      return res.json({
        success: true,
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          room_code: room.room_code,
          is_public: room.is_public,
          max_members: room.max_members,
          member_count: parseInt(room.member_count),
          dbml_content: room.dbml_content,
          creator_username: room.creator_username,
          created_at: room.created_at,
          updated_at: room.updated_at,
          user_role: userAccess.role,
          joined_at: userAccess.joined_at
        },
        members: members.map(member => ({
          id: member.id,
          username: member.username,
          role: member.role,
          joined_at: member.joined_at
        }))
      });
    }

    // Si no tiene acceso, verificar si la sala es pública o si puede unirse
    const canJoin = parseInt(room.member_count) < room.max_members;
    
    // Devolver información limitada para usuarios sin acceso
    return res.json({
      success: true,
      room: {
        name: room.name,
        description: room.description,
        room_code: room.room_code,
        is_public: room.is_public,
        max_members: room.max_members,
        member_count: parseInt(room.member_count),
        creator_username: room.creator_username,
        can_join: canJoin,
        user_is_member: false
      }
    });

  } catch (error) {
    console.error('❌ Get room error:', error.message);
    res.status(500).json({
      error: 'Failed to get room information',
      code: 'GET_ROOM_FAILED'
    });
  }
});

/**
 * PUT /api/rooms/:room_code/content
 * Actualizar contenido DBML de la sala
 */
router.put('/:room_code/content', authMiddleware, async (req, res) => {
  try {
    const { room_code } = req.params;
    const { dbml_content } = req.body;
    const user_id = req.user.userId;

    console.log(`💾 Updating content for room: ${room_code}`);

    // Buscar sala
    const room = await Room.findByCode(room_code);
    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }

    // Verificar acceso del usuario
    const userAccess = await Room.checkUserAccess(room.id, user_id);
    if (!userAccess) {
      return res.status(403).json({
        error: 'Access denied to this room',
        code: 'ACCESS_DENIED'
      });
    }

    // Actualizar contenido
    const updatedRoom = await Room.updateContent(room.id, dbml_content || '');

    res.json({
      success: true,
      message: 'Room content updated successfully',
      room: {
        id: updatedRoom.id,
        room_code: updatedRoom.room_code,
        updated_at: updatedRoom.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Update room content error:', error.message);
    res.status(500).json({
      error: 'Failed to update room content',
      code: 'UPDATE_CONTENT_FAILED'
    });
  }
});

/**
 * DELETE /api/rooms/:room_code/leave
 * Abandonar una sala
 */
router.delete('/:room_code/leave', authMiddleware, async (req, res) => {
  try {
    const { room_code } = req.params;
    const user_id = req.user.userId;

    console.log(`🚪 User ${user_id} leaving room: ${room_code}`);

    // Buscar sala
    const room = await Room.findByCode(room_code);
    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }

    // Abandonar sala
    const success = await Room.leaveRoom(room.id, user_id);

    if (success) {
      res.json({
        success: true,
        message: 'Successfully left the room'
      });
    } else {
      res.status(400).json({
        error: 'Failed to leave room',
        code: 'LEAVE_ROOM_FAILED'
      });
    }

  } catch (error) {
    console.error('❌ Leave room error:', error.message);

    if (error.message === 'User is not a member of this room') {
      return res.status(403).json({
        error: 'You are not a member of this room',
        code: 'NOT_A_MEMBER'
      });
    }

    res.status(500).json({
      error: 'Failed to leave room',
      code: 'LEAVE_ROOM_FAILED'
    });
  }
});

/**
 * DELETE /api/rooms/:room_code
 * Eliminar una sala (solo owner)
 */
router.delete('/:room_code', authMiddleware, async (req, res) => {
  try {
    const { room_code } = req.params;
    const user_id = req.user.userId;

    console.log(`🗑️ User ${user_id} deleting room: ${room_code}`);

    // Buscar sala
    const room = await Room.findByCode(room_code);
    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }

    // Eliminar sala
    const success = await Room.deleteRoom(room.id, user_id);

    if (success) {
      res.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } else {
      res.status(400).json({
        error: 'Failed to delete room',
        code: 'DELETE_ROOM_FAILED'
      });
    }

  } catch (error) {
    console.error('❌ Delete room error:', error.message);

    if (error.message === 'Only room owner can delete the room') {
      return res.status(403).json({
        error: 'Only the room owner can delete the room',
        code: 'OWNER_REQUIRED'
      });
    }

    res.status(500).json({
      error: 'Failed to delete room',
      code: 'DELETE_ROOM_FAILED'
    });
  }
});

/**
 * GET /api/rooms/:room_code/members
 * Obtener miembros de una sala
 */
router.get('/:room_code/members', authMiddleware, async (req, res) => {
  try {
    const { room_code } = req.params;
    const user_id = req.user.userId;

    console.log(`👥 Getting members for room: ${room_code}`);

    // Buscar sala
    const room = await Room.findByCode(room_code);
    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }

    // Verificar acceso del usuario
    const userAccess = await Room.checkUserAccess(room.id, user_id);
    if (!userAccess) {
      return res.status(403).json({
        error: 'Access denied to this room',
        code: 'ACCESS_DENIED'
      });
    }

    // Obtener miembros
    const members = await Room.getRoomMembers(room.id);

    res.json({
      success: true,
      members: members.map(member => ({
        id: member.id,
        username: member.username,
        email: member.email,
        role: member.role,
        joined_at: member.joined_at
      }))
    });

  } catch (error) {
    console.error('❌ Get room members error:', error.message);
    res.status(500).json({
      error: 'Failed to get room members',
      code: 'GET_MEMBERS_FAILED'
    });
  }
});

module.exports = router;