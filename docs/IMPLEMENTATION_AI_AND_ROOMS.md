# Implementación: IA y Gestión de Salas

Este documento complementa `docs/USE_CASES.md` añadiendo detalles prácticos para integrar un asistente de IA y para gestionar el ciclo de vida de salas colaborativas en dbdiagram-oss.

## Implementación con IA (Asistente de Diagrama)
- Objetivo: Integrar un asistente de IA que ayude a editar, sugerir y validar DBML y estructuras de bases de datos dentro de la sala colaborativa.
- Actores: Usuario, Web Client (Editor), IA Service (local/externo), WebSocket Server, Base de datos (logs / registros de auditoría)
- Precondiciones:
  - Usuario con permisos para invocar sugerencias (por ejemplo Owner o Member con permiso explícito).
  - Servicio de IA disponible (puede ser un servicio local, un microservicio o una API externa).

- Flujo principal (sugerencia bajo demanda):
  1. Usuario solicita una sugerencia (botón "Sugerir cambios", atajo de teclado o petición en contexto sobre una tabla/relación).
  2. El cliente construye un prompt con el contexto mínimo: porciones relevantes de DBML, metadatos de la sala, y el userId (sin exponer tokens sensibles).
  3. Cliente envía la petición al backend IA (o directamente al servicio IA si permitido) con `requestId` y `context`.
  4. Servicio IA responde con `suggestions` (puede incluir parches DBML, texto explicativo y riesgos).
  5. El cliente muestra las sugerencias en un modal (`AI Suggestions`) donde el usuario puede aceptar, rechazar o editar la sugerencia.
  6. Si el usuario acepta, el cliente aplica el parche localmente y emite `dbml-update`/`patch-apply` al servidor para propagar a la sala.

- Flujo alternativo (asistente proactivo):
  1. IA puede ejecutarse automáticamente en eventos clave (p. ej. al guardar o exportar) con consentimiento previo.
  2. Sugerencias automáticas se entregan como notificaciones en la UI; requieren confirmación para cambiar el documento compartido.

- Eventos JSON relevantes (ejemplos):
  - Cliente -> Server: `ai-suggestion-request` {
      room_code, requestId, userId, contextSnippet, preferences
    }
  - Server -> IA Service (or proxy): `ai-request` { requestId, context }
  - IA -> Server -> Client: `ai-suggestion-result` {
      requestId, userId, suggestions: [ { type: 'patch'|'advice', content, confidence } ], timestamp
    }
  - Cliente -> Server (on accept): `dbml-patch-apply` { room_code, userId, patch, message }

- Criterios de aceptación:
  - IA responde con sugerencias dentro de un tiempo razonable (configurable, p.ej. <5s para respuestas rápidas).
  - Las sugerencias no se aplican automáticamente sin consentimiento explícito.
  - Logs de requests/responses almacenados para auditoría (cumplir GDPR y privacidad según sea aplicable).

- Consideraciones de seguridad y privacidad:
  - Nunca enviar tokens de autenticación o datos sensibles del usuario al servicio IA.
  - Ofrecer la opción de usar un servicio IA local (on-premise) para equipos con restricciones de datos.
  - Registrar hashes/metadata y no el contenido completo cuando se almacenen trazas, si la política lo requiere.

---

## Implementación: Gestión de Salas (Lifecycle y Roles)
- Objetivo: Definir el ciclo de vida de una sala colaborativa, roles y APIs/eventos necesarios para gestión segura y coherente.
- Actores: Owner, Member, Web Client, WebSocket Server, Persistence (DB), Admin (ops)
- Conceptos clave:
  - room_code: Identificador público de la sala (ej. 8 caracteres alfanuméricos).
  - ownerId: Usuario que creó la sala y tiene permisos administrativos.
  - connectedUsers: Lista de usuarios actualmente conectados con metadata { userId, username, role }.
  - roomState: Estructura persistida con `currentContent` (DBML), `metadata` (título, visibilidad) y `audit`.

- Ciclo de vida (endpoints / eventos principales):
  1. Crear Sala (Client -> Server): `create-room` { token, options } -> Server crea `room_code`, ownerId y roomState persistido; responde `room-created` { room_code, ownerId }.
  2. Unirse a Sala (Client -> Server): `join-room` { room_code, token } -> Server valida y responde `room-joined` { roomState, connectedUsers }.
  3. Actualizar Metadatos (Client -> Server): `room-update-meta` { room_code, patch, userId } -> Server valida rol (owner) y actualiza BD; emite `room-meta-updated`.
  4. Salir/Cerrar Sala: `leave-room` / `close-room` -> Server elimina socket de la sala; si owner cierra y no hay persistencia explícita, opcionalmente marca sala como `closed`.
  5. Expulsar Miembro (Admin action): `kick-user` { room_code, targetUserId } -> Server valida owner/admin, desconecta y emite `user-kicked`.

- Eventos WebSocket recomendados (resumen):
  - Client -> Server: `join-room`, `leave-room`, `create-room`, `dbml-update`, `table-position-update`, `tablegroup-position-update`, `relationship-type-update`, `ai-suggestion-request`, `room-update-meta`, `kick-user`.
  - Server -> Clients: `room-joined`, `room-left`, `user-joined`, `user-left`, `room-meta-updated`, `table-position-update`, `tablegroup-position-update`, `dbml-update`, `ai-suggestion-result`, `user-kicked`.

- Validaciones y seguridad en el servidor:
  - Autenticación obligatoria: validar token en handshake o primer evento.
  - Autorización por evento: verificar que el `userId` tiene permiso para la acción (p. ej. `room-update-meta` requiere owner role).
  - Sanitización de payloads: chequear tamaños máximos y esquemas JSON (usar ajv u otra librería de validación).
  - Rate limiting / throttling: proteger eventos de alta frecuencia (p.ej. `table-position-update`).
  - Auditoría: guardar cambios críticos (quien aplicó patch DBML, timestamps) para soporte y recuperación.

- JSON Schema sugeridos (resumen):
  - table-position-update (Client -> Server):
    {
      "type": "object",
      "required": ["room_code","updateType","payload"],
      "properties": {
        "room_code": { "type": "string" },
        "updateType": { "const": "table-position-update" },
        "payload": {
          "type": "object",
          "required": ["tableId","position","isDragging"],
          "properties": {
            "tableId": { "type": "string" },
            "position": { "type": "object", "properties": { "x": { "type": "number" }, "y": { "type": "number" } } },
            "isDragging": { "type": "boolean" }
          }
        }
      }
    }

  - dbml-patch-apply (Client -> Server):
    {
      "type": "object",
      "required": ["room_code","userId","patch"],
      "properties": {
        "room_code": { "type": "string" },
        "userId": { "type": "string" },
        "patch": { "type": "string" },
        "message": { "type": "string" }
      }
    }

- Criterios de aceptación (resumen):
  - Creación y unión de salas maneja la concurrencia y evita race conditions al aplicar `currentContent`.
  - Roles y permisos son verificados en cada acción administrativa.
  - Eventos de alta frecuencia están throttled en cliente y validados/filtrados en servidor.

---

Fin del documento: recomendaciones y especificaciones para IA y gestión de salas.
