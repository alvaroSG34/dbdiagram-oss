// Configuración del servidor Socket.IO
export const socketConfig = {
  // Para desarrollo local
  development: {
    host: 'localhost',
    port: '3002'  // Mismo puerto que la API
  },
  
  // Para red local (cambiar por tu IP local)
  network: {
    host: '192.168.1.100', // CAMBIA ESTA IP POR TU IP LOCAL
    port: '3002'  // Mismo puerto que la API
  },
  
  // Para producción
  production: {
    host: 'brave-strength-production.up.railway.app',
    port: ''  // Railway maneja el puerto automáticamente
  }
};

// Función para obtener la URL del socket según el entorno
export const getSocketUrl = () => {
  // Detectar el entorno automáticamente
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isNetworkAccess = window.location.hostname.startsWith('192.168') || window.location.hostname.startsWith('10.') || window.location.hostname.startsWith('172.');
  
  let config;
  let protocol = 'http';
  
  if (isLocalhost) {
    config = socketConfig.development;
  } else if (isNetworkAccess) {
    config = socketConfig.network;
  } else {
    config = socketConfig.production;
    protocol = 'https'; // Usar HTTPS en producción
  }
  
  const url = config.port ? `${protocol}://${config.host}:${config.port}` : `${protocol}://${config.host}`;
  return url;
};

// Para configuración manual (útil para desarrollo)
export const getManualSocketUrl = (host = 'localhost', port = '3002') => {
  const url = `http://${host}:${port}`;
  return url;
};