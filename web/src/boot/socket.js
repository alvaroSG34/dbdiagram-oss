import { io } from 'socket.io-client';
import { boot } from 'quasar/wrappers';

const socket = io('http://localhost:3001');
let currentProjectId = null;

// Exportar la instancia del socket para que se pueda usar directamente
export { socket };

// Estado de conexión
let isConnected = false;
socket.on('connect', () => {
  console.log('Conectado al servidor WebSocket');
  isConnected = true;

  // Si estábamos en un proyecto antes de reconectar, volvemos a unirnos
  if (currentProjectId) {
    joinProject(currentProjectId);
  }
});

socket.on('disconnect', () => {
  console.log('Desconectado del servidor WebSocket');
  isConnected = false;
});

// Unirse a un proyecto específico
function joinProject(projectId) {
  if (!projectId) return;
  
  currentProjectId = projectId;
  if (isConnected) {
    socket.emit('join-project', projectId);
    console.log(`Unido al proyecto: ${projectId}`);
  }
}

// Enviar una actualización del diagrama
function sendDiagramUpdate(updateType, payload) {
  if (!currentProjectId) {
    console.warn('No hay un proyecto activo, no se puede enviar la actualización');
    return;
  }

  console.log(`Enviando actualización [${updateType}]:`, payload);
  socket.emit('diagram-update', {
    projectId: currentProjectId,
    updateType,
    payload
  });
  
  // Agregar confirmación de envío (opcional)
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Actualización [${updateType}] enviada correctamente`);
      resolve();
    }, 50);
  });
}

// Escuchar actualizaciones de diagrama
function onDiagramUpdate(callback) {
  socket.on('diagram-update', (data) => {
    // Solo procesamos las actualizaciones si no provienen de este cliente
    if (data.userId !== socket.id) {
      callback(data);
    }
  });
}

// Escuchar cuando un usuario se une
function onUserJoined(callback) {
  socket.on('user-joined', (data) => {
    callback(data);
  });
}

// Escuchar cuando un usuario se va
function onUserLeft(callback) {
  socket.on('user-left', (data) => {
    callback(data);
  });
}

// Escuchar la lista de usuarios conectados
function onConnectedUsers(callback) {
  socket.on('connected-users', (data) => {
    callback(data);
  });
}

export default boot(({ app }) => {
  // Hacer que las funciones de WebSocket estén disponibles en toda la aplicación
  app.config.globalProperties.$socket = {
    joinProject,
    sendDiagramUpdate,
    onDiagramUpdate,
    onUserJoined,
    onUserLeft,
    onConnectedUsers
  };
});

// Exportar las funciones para uso en componentes Options API y Composition API
export {
  joinProject,
  sendDiagramUpdate,
  onDiagramUpdate,
  onUserJoined,
  onUserLeft,
  onConnectedUsers
};
