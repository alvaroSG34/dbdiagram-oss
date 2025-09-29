# Actores del sistema — dbdiagram-oss

Este documento describe los actores (humanos y componentes del sistema) involucrados en la aplicación `dbdiagram-oss`, sus responsabilidades principales, puntos de integración en el código y eventos/claves de datos importantes.

## Resumen
La aplicación es una SPA (Quasar + Vue) con colaboración en tiempo real a través de un servidor WebSocket (`api/socketServer.js`). El motor de diagramas está en `web/src/components/VDbChart` (JointJS + componentes Vue). El formato principal es DBML y hay un parser/extension en `web/src/proposed-extension`.

---

## Actores Humanos

- Usuario (Owner)
  - Descripción: Propietario de la sala o del documento DBML. Normalmente quien crea la sala o el diagrama.
  - Responsabilidades: Editar DBML, mover tablas, cambiar relaciones UML, invitar/administrar miembros (según permisos), guardar contenido en la sala.
  - Interacciones técnicas: Usa la UI (`web/src/pages/Editor/Index.vue`, `DbmlEditor.vue`) y se autentica via WebSocket.

- Usuario (Member / Colaborador)
  - Descripción: Usuario con permiso para colaborar dentro de una sala.
  - Responsabilidades: Editar DBML, mover tablas, comentar, sincronizar con el resto de miembros.
  - Interacciones técnicas: Igual que el owner pero normalmente con menos permisos (según `userRole`).

- Usuario (Invitado/Guest)
  - Descripción: Usuario con permisos limitados o solo lectura (si aplica).
  - Responsabilidades: Visualizar diagrama, posiblemente comentar.

- Administrador / Desarrollador del sistema
  - Descripción: Persona que mantiene el servidor (WebSocket/API) y la base de datos.
  - Responsabilidades: Desplegar y mantener `api/socketServer.js`, gestionar la BD (Postgres) y reparar problemas de sincronización.

---

## Actores del Sistema (componentes y servicios)

- Web Client (SPA)
  - Archivos clave: `web/src/pages/Editor/Index.vue`, `web/src/components/DbmlEditor.vue`, `web/src/components/DbmlGraph.vue`, `web/src/components/VDbChart/*`
  - Rol: Interfaz principal para edición y visualización. Administra la conexión al WebSocket y delega eventos de colaboración.
  - Responsabilidades: Conexión WebSocket (configuraciones en `web/src/config/socket.config.js`), manejo del estado del editor (Pinia store en `web/src/store`), render del diagrama (JointJS wrappers).

- Editor de DBML
  - Archivos clave: `web/src/components/DbmlEditor.vue`, `web/src/components/ace/*`
  - Rol: Entrada de DBML y actualizaciones del diagrama.
  - Responsabilidades: Parseo/validación del DBML (parser en `web/src/proposed-extension/dbml-parser-extension.js`), actualizar el store y emitir cambios a la sala.

- Componente de Diagrama (VDbChart / VDbTable / VDbTableGroup, etc.)
  - Archivos clave: `web/src/components/VDbChart/VDbChart.vue`, `VDbTable.vue`, `VDbTableGroup.vue`, `VDbRef.vue`
  - Rol: Renderizado y lógica de interacción (drag & drop, zoom, pan, tooltips).
  - Responsabilidades: Detectar arrastres, calcular posiciones y enviar eventos de posición a través del WebSocket (o usar el canal local en modo normal).

- Socket Client (config y abstracción)
  - Archivos clave: `web/src/config/socket.config.js`, `web/src/boot/socket.js`
  - Rol: Encapsula la conexión a `http://localhost:3001` y reexpone la API para la app.
  - Responsabilidades: Conectar, reintentar, emitir/escuchar eventos, manejar autenticación (token) y room codes.

- WebSocket Server (Colaboración en tiempo real)
  - Archivos clave: `api/socketServer.js`
  - Rol: Broker de eventos para la colaboración en sala (room-based).
  - Responsabilidades:
    - Autenticar clientes WebSocket.
    - Gestionar salas activas y usuarios conectados.
    - Recepcionar eventos (por ejemplo `table-position-update`, `tablegroup-position-update`, `relationship-type-update`) y retransmitirlos a los otros miembros de la sala.
    - Guardar/recuperar el estado inicial de la sala (desde Postgres) cuando un usuario se une.
  - Eventos importantes (ejemplos):
    - Entrada: `join-room` / custom room join
    - Entrada: `table-position-update` — servidor retransmite a la sala `{ userId, username, updateType, payload, timestamp }`
    - Entrada: `tablegroup-position-update` — similar para grupos
    - Entrada: `relationship-type-update` — cambios en el tipo de relación UML

- Base de datos (PostgreSQL)
  - Rol: Persistencia del contenido de la sala (DBML, metadata de sala, usuarios, roles).
  - Responsabilidades: Guardar `currentContent` de la sala, usuarios y roles, historial mínimo (según implementación en `api`).

- DBML Parser / Extension
  - Archivos clave: `web/src/proposed-extension/dbml-parser-extension.js`, `web/public/mode-dbml.js`
  - Rol: Parsear DBML hacia la representación interna usada por el `VDbChart`.
  - Responsabilidades: Proveer parsing estable y transformaciones; exponer utilidades de import/export.

- Utils / Storage
  - Archivos clave: `web/src/utils/storageUtils.js`, `web/src/utils/usersService.js`
  - Rol: Helpers para persistencia local, manejo de usuarios, etc.

---

## Eventos y formas de datos (resumen rápido)

- `table-position-update` (Cliente -> Server)
  - Payload desde cliente (ejemplo):
    ```json
    {
      "room_code": "2NONW80K",
      "updateType": "table-position-update",
      "payload": {
        "tableId": 1,
        "position": { "x": -115, "y": -355 },
        "isDragging": false
      }
    }
    ```
  - Retransmisión por servidor (ejemplo):
    ```json
    {
      "userId": 1,
      "username": "testuser",
      "updateType": "table-position-update",
      "payload": { ... },
      "timestamp": "2025-09-24T..."
    }
    ```

- `tablegroup-position-update` — similar, payload incluye `groupId` y lista de tablas si aplica.
- `relationship-type-update` — incluye `refId`, `relationType`, posiblemente `startMarker` / `endMarker`.
- `room-joined` — servidor envía estado inicial de la sala: `room.currentContent`, `connectedUsers`, `userRole`.

---

## Flujos de interacción (ejemplo: mover una tabla)

1. Usuario arrastra una tabla en `VDbTable.vue`.
2. `VDbTable` calcula la posición (x,y) y llama a `sendPositionUpdate`.
3. Si está en modo sala, se emite `table-position-update` a `api/socketServer.js` con `room_code` y `payload`.
4. El servidor valida la membresía en la sala y retransmite el evento a los demás sockets en la sala.
5. Cada cliente recibe el evento y `Editor/Index.vue` delega la actualización a `DbmlGraph.vue` (por ejemplo, con `window.handleTablePositionUpdate(data)`).
6. `DbmlGraph` actualiza el store (chart) y el renderizador mueve la tabla en la UI.

---

## Casos límite y consideraciones

- Eventos propios: Los clientes normalmente ignoran eventos que provienen del mismo `userId` (para evitar reaplicaciones), pero en pruebas es útil poder procesarlos.
- Conexiones intermitentes: `socket.config` y `socketServer.js` deben manejar reconexión y re-sincronización del contenido.
- Integridad del contenido: Si dos usuarios editan DBML concurrentemente, existe riesgo de sobreescritura. Actualmente el diseño reescribe `room.currentContent` cuando se guardan cambios (ver `relationship-type-update` y handler en editor store).
- Seguridad: Autenticación en WebSocket; el servidor comprueba `socket.currentRoom` y `userId` antes de aceptar actualizaciones.

---

## Siguientes pasos recomendados

- Añadir diagramas simples (sequence) para cada flujo crítico (mover tabla, editar relación, unirse a sala).
- Documentar los contratos JSON de cada evento con ejemplos completos y schemas JSON (ajustar cuando se encuentre especificación formal).
- Documentar roles/privilegios (owner vs member) y dónde se aplican las comprobaciones.

---

Documento generado a partir del análisis del código y los archivos principales del repositorio (carpetas `web/` y `api/`).
