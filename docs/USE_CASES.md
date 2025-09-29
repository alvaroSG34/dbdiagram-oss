# Casos de Uso — dbdiagram-oss

Este documento contiene casos de uso prioritarios para la aplicación colaborativa `dbdiagram-oss`. Cada caso incluye: objetivo, actores, precondiciones, escenario principal (happy path), flujos alternativos y criterios de aceptación. También se indican eventos JSON relevantes y notas de implementación.

---

## UC-01: Crear o Unirse a una Sala
- Objetivo: Permitir a un usuario crear una sala de colaboración o unirse a una existente.
- Actores: Usuario (Owner o Member), Web Client, WebSocket Server, Base de datos
- Precondiciones:
  - Usuario autenticado (token disponible en el cliente).
  - Si la sala existe, el servidor tiene metadata (room code, currentContent).
- Flujo principal:
  1. Usuario hace click en "Crear sala" o abre URL `/room/{code}`.
  2. El cliente solicita al servidor WebSocket unirse/crear la sala (evento `join-room` o equivalente).
  3. El servidor valida autenticación y permisos.
  4. El servidor añade el socket a la sala (`socket.join(room_code)`), recupera `currentContent` y `connectedUsers` desde la BD y responde con `room-joined`.
  5. El cliente recibe `room-joined`, actualiza `roomContent` y renderiza el diagrama.
- Eventos JSON relevantes:
  - Cliente -> Server: `join-room` (body: `{ room_code, token }`)
  - Server -> Cliente: `room-joined` (body: `{ success, room: { code, currentContent, connectedUsers, userRole } }`)
- Criterios de aceptación:
  - Cliente recibe `room-joined` con contenido válido y renderiza el diagrama.
  - Usuarios listados en `connectedUsers` aparecen en la UI.

---

## UC-02: Editar el DBML del Diagrama
- Objetivo: Permitir editar el DBML (texto) y propagar cambios de guardado/edición relevantes.
- Actores: Usuario, Web Client (DbmlEditor), WebSocket Server, Base de datos
- Precondiciones:
  - Usuario conectado a la sala.
  - Editor con contenido inicial cargado.
- Flujo principal (guardar o aplicar cambios importantes):
  1. Usuario modifica el texto en `DbmlEditor`.
  2. El cliente puede aplicar cambios en local (preview) y luego guardar/emitir al servidor.
  3. Al guardar, cliente emite evento (ej. `dbml-update` o `relationship-type-update`) con `dbml_content` al servidor.
  4. El servidor almacena (opcional) y retransmite la actualización a la sala.
  5. Los demás clientes reciben la actualización y actualizan su editor/diagrama.
- Eventos JSON relevantes:
  - `dbml-update` o `relationship-type-update` con `{ userId, username, dbml_content, ... }`
- Criterios de aceptación:
  - Guardar desde un cliente actualiza `room.currentContent` y el cambio llega a otros clientes.
  - El parser no rompe con entradas invalidas (si hay invalid input, mostrar error al usuario).

---

## UC-03: Mover una Tabla (Sincronización en Tiempo Real)
- Objetivo: Sincronizar la posición de una tabla mientras se arrastra y cuando se suelta.
- Actores: Usuario, VDbTable (cliente), WebSocket Server, Otros clientes en la sala
- Precondiciones:
  - Usuario conectado y la tabla existe en el diagrama.
  - Cliente en modo sala (room mode).
- Flujo principal (happy path):
  1. Usuario inicia arrastre en `VDbTable`.
  2. `VDbTable` calcula posiciones y, con throttling, emite `table-position-update` al servidor con payload `{ tableId, position, isDragging }`.
  3. Servidor valida room y retransmite el evento a los demás sockets en la sala: `{ userId, username, updateType, payload, timestamp }`.
  4. Cada cliente recibe el evento en `Editor/Index.vue` y delega a `DbmlGraph` (por ejemplo vía `window.handleTablePositionUpdate`).
  5. `DbmlGraph` actualiza store/tabla y el renderizador mueve la tabla en la UI.
- Flujos alternativos / Consideraciones:
  - Evitar reaplicar eventos del propio usuario (comparando `userId`) para no interferir con arrastre local.
  - En caso de pérdida de conexión, usar posición final enviada al soltar para re-sincronizar.
  - Throttling recomendado ~50ms para reducir carga.
- Eventos JSON relevantes:
  - Cliente -> Server: `table-position-update` `{ room_code, updateType: 'table-position-update', payload: { tableId, position, isDragging } }`
  - Server -> Sala: `table-position-update` `{ userId, username, updateType, payload, timestamp }`
- Criterios de aceptación:
  - Posiciones se actualizan en <200ms en clientes remotos en redes locales.
  - No aparecen saltos bruscos ni duplicaciones visuales.

---

## UC-04: Mover un Grupo de Tablas
- Objetivo: Mover un conjunto de tablas (grupo) y sincronizar posiciones de todas.
- Actores: Usuario, VDbTableGroup, WebSocket Server, Clientes remotos
- Precondiciones: Grupo definido y tablas incluidas en el grupo.
- Flujo principal:
  1. Usuario arrastra el grupo; `VDbTableGroup` calcula nuevas posiciones para cada tabla.
  2. Cliente emite `tablegroup-position-update` con payload `{ groupId, position, tablePositions[], isDragging }`.
  3. Servidor retransmite a la sala.
  4. Clientes aplican las nuevas posiciones en el store y render.
- Criterios de aceptación:
  - Todas las tablas del grupo se reposicionan en clientes remotos coherentemente.

---

## UC-05: Cambiar Tipo de Relación (UML)
- Objetivo: Modificar el tipo de relación entre tablas y que el cambio se refleje en todos los clientes.
- Actores: Usuario, VDbRef/VDbRefUml, WebSocket Server
- Flujo principal:
  1. Usuario selecciona una relación y cambia el tipo (por ejemplo association -> composition).
  2. Cliente emite `relationship-type-update` con `{ refId, relationType, startMarker, endMarker }`.
  3. Servidor retransmite; clientes actualizan representación visual.
- Criterios de aceptación:
  - Tipo de relación cambia de forma consistente en todos los clientes.

---

## UC-06: Indicadores de Presencia y Lista de Usuarios Conectados
- Objetivo: Mostrar quién está en la sala en tiempo real.
- Actores: Web Client, WebSocket Server
- Flujo principal:
  1. Al unirse a la sala, servidor incluye `connectedUsers` en `room-joined`.
  2. Cuando un usuario se une/parte, servidor emite eventos `user-joined` / `user-left` con `userId` y `username`.
  3. El cliente actualiza la UI de presencia (`ConnectedUsers.vue`).
- Criterios de aceptación:
  - Lista de usuarios refleja el estado real de la sala.

---

## UC-07: Guardar/Exportar DBML
- Objetivo: Permitir guardar o exportar el DBML actual (por ejemplo descarga o copia de seguridad).
- Actores: Usuario, Web Client, Backend/Storage
- Flujo principal:
  1. Usuario solicita export (botón "Export").
  2. Cliente toma `room.currentContent` y ofrece descarga o llama a API para persistir snapshot.
- Criterios de aceptación:
  - Archivo DBML descargable y válido.

---

## UC-08: Reconexion y Re-sincronización
- Objetivo: Recuperar estado correcto tras reconexión del cliente.
- Actores: Cliente Web, WebSocket Server, Base de datos
- Flujo principal:
  1. Cliente detecta desconexión y reintenta conexión.
  2. Al reconectar, cliente solicita rejoin de sala.
  3. Servidor envía estado actual (`room.currentContent`) y `connectedUsers`.
  4. Cliente actualiza editor/diagrama para coincidir con el estado del servidor.
- Criterios de aceptación:
  - Tras reconexión, contenido local coincide con `room.currentContent` del servidor.

---

## UC-09: Gestión de Permisos (Owner vs Member)
- Objetivo: Controlar acciones sensibles según rol (por ejemplo eliminar sala, cambiar owner, administrar miembros).
- Actores: Owner, Member, Server
- Flujo principal:
  1. Owner realiza acción administrativa (p.ej. expulsar miembro).
  2. Cliente envía petición al servidor; servidor verifica rol y ejecuta la acción si procede.
- Criterios de aceptación:
  - Acciones administrativas solamente ejecutables por owners (servidor valida).

---

## UC-10: Importar DBML / Integraciones
- Objetivo: Permitir importar DBML desde archivos o formatos externos (compatibilidad con export/import).
- Actores: Usuario, Web Client, Parser
- Flujo principal:
  1. Usuario sube archivo DBML o pega texto.
  2. Cliente usa parser para convertir a estructura interna y renderizar.
  3. Opcionalmente, cliente emite actualización al servidor para propagar a la sala.
- Criterios de aceptación:
  - Parser soporta la sintaxis esperada y reporta errores amigables si hay problemas.

---

## UC-11: ChatPanel con IA (Asistente Conversacional en Sala)
- Objetivo: Proveer un panel de chat integrado en la sala que permita comunicación entre usuarios y consultas asistidas por IA (sugerencias, explicación de cambios, generación de parches DBML).
- Actores: Usuario, Web Client (ChatPanel), IA Service (local/externo), WebSocket Server, Connected Users
- Precondiciones:
  - Usuario autenticado y conectado a la sala.
  - Servicio IA disponible si se desea utilizar funciones asistidas.

- Flujo principal (chat entre usuarios):
  1. Usuario abre el `ChatPanel` dentro de la sala.
  2. Usuario escribe y envía un mensaje; el cliente emite `chat-message` al servidor con `{ room_code, userId, message, timestamp }`.
  3. Servidor valida y retransmite `chat-message` a los sockets de la sala.
  4. Clientes muestran el mensaje en la UI del `ChatPanel` con metadata (username, timestamp).

- Flujo con IA (sugerencia o resumen):
  1. Usuario puede pedir al asistente IA: comandos como `/suggest`, `/explain table:users`, `/summarize recent`.
  2. Cliente envía `ai-chat-request` con `{ room_code, requestId, userId, command, contextSnippet }` al servidor.
  3. Server (o proxy) envía la petición al servicio IA; IA devuelve `ai-chat-response` con `text` y opcional `patch`.
  4. Servidor retransmite `ai-chat-response` a la sala; el cliente muestra la respuesta en el chat.
  5. Si la respuesta incluye un `patch` DBML, el usuario puede aplicar el parche localmente y emitir `dbml-patch-apply` para propagarlo.

- Eventos JSON relevantes:
  - Client -> Server: `chat-message` { room_code, userId, message, timestamp }
  - Client -> Server: `ai-chat-request` { room_code, requestId, userId, command, contextSnippet }
  - Server -> Clients: `chat-message` { userId, username, message, timestamp }
  - Server -> Clients: `ai-chat-response` { requestId, userId, responseText, patch?, confidence }

- Criterios de aceptación:
  - Mensajes del chat se muestran en <200ms para la mayoría de redes locales.
  - Comandos IA devuelven respuestas entendibles y no aplican cambios sin confirmación explícita.
  - Historial del chat puede ser opcionalmente persistido para auditoría.

- Notas de implementación y UX:
  - Agregar indicadores de "escribiendo" para otros usuarios.
  - Mostrar claramente cuando un mensaje es generado por IA (badge "IA").
  - Comandos con potencial de cambio (por ejemplo `/apply-suggestion`) deben requerir doble confirmación.

---

## UC-12: Gestión avanzada de salas (Roles, Moderación y Auditoría)
- Objetivo: Proveer herramientas para administrar salas en equipos grandes: roles extendidos, moderación (kick/ban), historial y auditoría de cambios.
- Actores: Owner, Moderator, Member, Web Client, WebSocket Server, Persistence (DB)
- Precondiciones:
  - Owner creó la sala o tiene permisos administrativos.
  - El servidor mantiene persistencia de room metadata y logs de auditoría.

- Flujo principal (asignar rol / moderación):
  1. Owner/Moderator accede a panel de administración de la sala.
  2. Owner asigna rol (p. ej. Moderator) a un miembro: cliente emite `room-assign-role` { room_code, targetUserId, role }.
  3. Servidor valida que el solicitante tiene permisos y actualiza `roomState` en BD; emite `room-role-updated`.
  4. Para moderación, Owner/Moderator puede expulsar o banear: `kick-user` / `ban-user` con `{ room_code, targetUserId, duration? }`.
  5. Servidor ejecuta acción (desconecta socket, marca en DB) y notifica la sala `user-kicked` / `user-banned`.

- Eventos JSON relevantes:
  - Client -> Server: `room-assign-role` { room_code, requesterId, targetUserId, role }
  - Server -> Clients: `room-role-updated` { room_code, targetUserId, role, updatedBy }
  - Client -> Server: `kick-user` / `ban-user` { room_code, requesterId, targetUserId, duration }
  - Server -> Clients: `user-kicked` / `user-banned` { room_code, targetUserId, reason, byUserId }

- Criterios de aceptación:
  - Solo usuarios con rol adecuado pueden realizar acciones administrativas; el servidor valida en cada petición.
  - Acciones de moderación quedan registradas en la auditoría con `who/when/why`.
  - Usuarios baneados no pueden reentrar hasta que expire el ban o un owner lo retire.

- Notas operativas:
  - Registrar cambios críticos en un log inmutable (o BD con acceso controlado) para auditoría.
  - Implementar endpoints administrativos (REST o WebSocket) para listar/buscar salas, miembros y logs (p. ej. para equipos de soporte).
  - Ofrecer webhooks (opcional) para integraciones (p. ej. enviar alertas a Slack cuando se banea a un usuario).

---

## UC-13: Importar Imagen (PNG/JPG) e Insertarla en el Editor DBML
- Objetivo: Permitir al usuario subir una imagen (png/jpg) y que ésta se incorpore en el lienzo/editor como un elemento embebido o referencia que puede posicionarse y guardarse en el `room.currentContent`.
- Actores: Usuario, Web Client (Editor), WebSocket Server, Storage (local/remote), DB
- Precondiciones:
  - Usuario autenticado y con permiso para editar el diagrama.
  - Tamaño y formato de imagen permitidos por política (p.ej. <5MB, png/jpg).

- Flujo principal:
  1. Usuario selecciona "Insertar imagen" y elige un archivo PNG o JPG.
  2. Cliente valida el archivo (tipo, tamaño) y opcionalmente genera una versión optimizada (thumbnail/resize).
  3. Cliente sube la imagen al servidor/storage (API REST o WebSocket binary) y recibe `imageUrl` o `imageId`.
  4. Cliente crea un nuevo elemento en el diagrama (por ejemplo `ImageElement`) con `{ id, imageUrl, position, width, height }` y lo añade al `room.currentContent`.
  5. Cliente emite `image-inserted` o `dbml-update` (si la representación se modela dentro del DBML) para propagar la inserción a la sala.
  6. Servidor persiste referencia en base de datos y retransmite el evento a la sala.

- Eventos JSON/Flows relevantes:
  - Client -> Server: `image-upload-init` (multipart POST o streaming WS)
  - Server -> Client: `image-uploaded` { imageId, imageUrl, width, height }
  - Client -> Server: `image-inserted` { room_code, userId, element: { id, imageId/imageUrl, position, size } }
  - Server -> Clients: `image-inserted` { userId, element }

- Criterios de aceptación:
  - La imagen se muestra correctamente en todos los clientes conectados a la sala.
  - Las referencias a imágenes son persistentes (o el servidor ofrece un TTL explícito si se guarda temporalmente).
  - Validación de tipo y tamaño se realiza en cliente y servidor.

- Consideraciones de implementación:
  - Almacenar imágenes en un storage (S3, local uploads/ folder) y servirlas por URL segura.
  - Para privacidad, permitir option para no persistir imágenes (solo local) o para cifrado en reposo.
  - Implementar optimizaciones (lazy load, thumbnails) para rendimiento en diagramas con muchas imágenes.

---

## UC-14: Exportación de Código Spring Boot basado en DBML
- Objetivo: Generar código boilerplate de un proyecto Spring Boot (entidades, repositorios, DTOs y esqueletos de servicios) a partir del DBML actual del editor.
- Actores: Usuario, Web Client (Editor), Code Generation Service (backend), WebSocket Server / REST API, Storage (zip)
- Precondiciones:
  - DBML es válido y parseable por el parser del cliente/servidor.
  - Usuario con permisos para exportar código.

- Flujo principal:
  1. Usuario selecciona "Exportar Spring Boot" en la UI.
  2. Cliente envía el DBML actual (o `room.currentContent`) al `Code Generation Service` via REST `POST /generate/springboot` con opciones (packageName, targetJavaVersion, includeTests).
  3. El servicio parsea el DBML, genera artefactos: entidades JPA, repositorios Spring Data, DTOs, mapeos y configuración básica de proyecto (pom.xml/gradle.build).
  4. Servicio crea un paquete ZIP con el proyecto scaffold y devuelve `downloadUrl` o stream directo.
  5. Cliente descarga el ZIP y muestra un link/preview. Opcionalmente, el servicio puede persistir generación en storage para auditoría.

- Inputs/Options recomendadas:
  - packageName: com.example.generated
  - targetJavaVersion: 17
  - orm: spring-data-jpa
  - includeSwagger: true/false
  - includeTests: true/false

- Eventos/Endpoints relevantes:
  - Client -> Server (REST): POST /generate/springboot { dbml, options }
  - Server -> Client: 200 OK + { downloadUrl }

- Criterios de aceptación:
  - El ZIP descargado compila con la configuración solicitada (p. ej. `mvn -f pom.xml test` pasa en el proyecto generado, asumiento dependencias correctas).
  - Las entidades generadas reflejan las columnas/tipos y relaciones del DBML.
  - La generación es determinista y documentada (versión de generador incluida en el ZIP).

- Consideraciones de seguridad y operativas:
  - Validar y sanear nombres (package, entity) para evitar inyección de paths o contenido malicioso.
  - Limitar el tamaño y frecuencia de peticiones de generación para evitar abusos (rate-limits, quotas).
  - Proveer opción de generar localmente (CLI) para equipos que no quieran enviar DBML a un servicio remoto.

---

## Notas generales y prioridades
- Priorizar UC-03 (mover tablas) y UC-02 (editar DBML) porque son las funcionalidades centrales de colaboración en tiempo real.
- UC-08 (reconexión) es crítica para UX en redes inestables.
- Para cada UC conviene proveer un JSON Schema para los eventos y un diagrama de secuencia breve.

---

Documento generado con base en el código fuente del repositorio y la sesión de diagnóstico activa.
