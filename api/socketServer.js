const http = require('http');
const { Server } = require('socket.io');

// Crear un servidor HTTP básico
const server = http.createServer();

// Inicializar Socket.IO en el servidor
const io = new Server(server, {
  cors: {
    origin: '*', // En producción, esto debería limitarse a dominios específicos
    methods: ['GET', 'POST']
  }
});

// Gestión de proyectos/salas
const projects = new Map(); // Almacena información sobre los proyectos activos

// Manejar conexiones de clientes
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Unirse a un proyecto específico
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`Cliente ${socket.id} se unió al proyecto ${projectId}`);
    
    // Inicializar el proyecto si es necesario
    if (!projects.has(projectId)) {
      projects.set(projectId, {
        users: new Set(),
        // Aquí podríamos almacenar el estado actual del diagrama si fuera necesario
      });
    }
    
    // Añadir usuario al proyecto
    const project = projects.get(projectId);
    project.users.add(socket.id);
    
    // Notificar a otros usuarios del proyecto sobre el nuevo participante
    socket.to(projectId).emit('user-joined', { userId: socket.id });
  });

  // Recibir cambios en el diagrama (DBML o visual)
  socket.on('diagram-update', (data) => {
    const { projectId, updateType, payload } = data;
    console.log(`Actualización recibida de ${socket.id} para el proyecto ${projectId}: ${updateType}`);
    console.log('Payload:', JSON.stringify(payload));
    
    // Retransmitir la actualización a todos los demás clientes en el mismo proyecto
    socket.to(projectId).emit('diagram-update', {
      userId: socket.id,
      updateType,
      payload
    });
    
    // Confirmación de que se ha retransmitido el mensaje
    console.log(`Actualización ${updateType} retransmitida a otros usuarios en el proyecto ${projectId}`);
  });

  // Manejar desconexiones
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
    
    // Remover al usuario de todos los proyectos
    for (const [projectId, project] of projects.entries()) {
      if (project.users.has(socket.id)) {
        project.users.delete(socket.id);
        
        // Notificar a otros usuarios del proyecto
        socket.to(projectId).emit('user-left', { userId: socket.id });
        
        // Limpiar proyectos vacíos
        if (project.users.size === 0) {
          projects.delete(projectId);
          console.log(`Proyecto ${projectId} cerrado - sin usuarios activos`);
        }
      }
    }
  });
});

// Iniciar el servidor en el puerto 3001
server.listen(3001, () => {
  console.log('Servidor WebSocket ejecutándose en http://localhost:3001');
});
