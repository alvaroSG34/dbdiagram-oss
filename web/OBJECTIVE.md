# Objetivo del Proyecto

El objetivo principal de este proyecto es **integrar WebSockets** para habilitar la colaboración en tiempo real dentro de la aplicación de diagramas.

## Descripción

Actualmente la aplicación permite la creación y edición de diagramas de bases de datos.  
La nueva meta es enfocarnos únicamente en la funcionalidad de **colaboración en tiempo real**, de manera que **dos o más usuarios puedan trabajar sobre el mismo diagrama y visualizar instantáneamente los cambios realizados por cualquier participante**, sin necesidad de refrescar la página.

## Requisitos de la Funcionalidad

- **Sincronización en tiempo real:**  
  Cada acción realizada (crear, mover, editar o eliminar un elemento) debe reflejarse automáticamente en todos los clientes conectados al mismo proyecto.

- **Experiencia fluida:**  
  Las actualizaciones deben mostrarse de forma visual, clara y sin interrupciones para los usuarios.

- **Consistencia del estado:**  
  El estado del diagrama debe mantenerse sincronizado en todos los navegadores conectados mediante WebSockets.

## Prioridad

Este objetivo es **único y prioritario**:  
**implementar correctamente la colaboración en tiempo real con WebSockets** antes de avanzar a cualquier otra funcionalidad del sistema.
