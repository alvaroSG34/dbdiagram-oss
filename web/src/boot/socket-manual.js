// ARCHIVO ALTERNATIVO: socket-manual.js
// Usar este archivo si quieres configuración manual simple

import { io } from 'socket.io-client';
import { boot } from 'quasar/wrappers';

// 🔧 CONFIGURACIÓN MANUAL - Cambiar la IP aquí
const SOCKET_SERVER_IP = '192.168.1.100'; // CAMBIAR POR TU IP LOCAL
const SOCKET_PORT = '3001';

const socket = io(`http://${SOCKET_SERVER_IP}:${SOCKET_PORT}`);

// Estado de conexión
let isConnected = false;
let currentProjectId = null;

socket.on('connect', () => {
  console.log(`🔌 Conectado al servidor WebSocket en ${SOCKET_SERVER_IP}:${SOCKET_PORT}`);
  isConnected = true;

  if (currentProjectId) {
    joinProject(currentProjectId);
  }
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor WebSocket');
  isConnected = false;
});

// ... resto del código igual que el archivo original ...