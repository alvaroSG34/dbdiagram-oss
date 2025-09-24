-- ================================================
-- SCHEMA: dbdiagram-oss Authentication System
-- Database: PostgreSQL
-- ================================================

-- Crear base de datos (ejecutar primero en pgAdmin)
-- CREATE DATABASE dbdiagram_app;

-- Conectarse a dbdiagram_app antes de ejecutar el resto

-- ================================================
-- TABLA: users
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints adicionales
    CONSTRAINT users_username_length CHECK (length(username) >= 3),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$')
);

-- ================================================
-- TABLA: rooms
-- ================================================
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    room_code VARCHAR(8) UNIQUE NOT NULL,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dbml_content TEXT DEFAULT '',
    is_public BOOLEAN DEFAULT FALSE,
    max_members INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT rooms_name_length CHECK (length(name) >= 1),
    CONSTRAINT rooms_max_members_range CHECK (max_members >= 1 AND max_members <= 10)
);

-- ================================================
-- TABLA: room_members
-- ================================================
CREATE TABLE IF NOT EXISTS room_members (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un usuario no puede estar duplicado en la misma sala
    UNIQUE(room_id, user_id)
);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);

-- ================================================
-- FUNCIONES Y TRIGGERS
-- ================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- FUNCIÓN PARA GENERAR ROOM CODES
-- ================================================
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(8) := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE 'plpgsql';

-- ================================================
-- DATOS DE PRUEBA (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- ================================================

-- Insertar usuario de prueba (password: "password123")
-- INSERT INTO users (username, email, password_hash) 
-- VALUES (
--     'testuser', 
--     'test@dbdiagram.com', 
--     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiCFkOn0kKq.'
-- ) ON CONFLICT (email) DO NOTHING;

-- ================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- ================================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'rooms', 'room_members')
ORDER BY table_name;

-- Verificar índices
SELECT 
    indexname, 
    tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'rooms', 'room_members')
ORDER BY tablename, indexname;