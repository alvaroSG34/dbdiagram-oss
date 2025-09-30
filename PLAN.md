# Copilot Instructions for dbdiagram-oss

This guide enables AI coding agents to be productive in the dbdiagram-oss codebase. It summarizes architecture, workflows, conventions, and integration points specific to this project.

---

## Project Overview

dbdiagram-oss is an open source alternative to dbdiagram.io, providing database diagramming features such as dark mode, header colors, and table groups.  
- **Live Demo:** [trudan.github.io/dbdiagram-oss](https://trudan.github.io/dbdiagram-oss/)
- **License:** [MIT](https://choosealicense.com/licenses/mit/)
- **Core Libraries:**  
  - [Quasar](https://quasar.dev/) (VueJS framework)  
  - [JointJS](https://github.com/clientIO/joint) (diagram/charting)  
  - [dbml.org](https://www.dbml.org/home/) (DBML parser/importer/exporter)

---

## Big Picture Architecture

- **Monorepo Structure:**  
  - `web/`: Vue.js + Quasar SPA for diagram editing and visualization.  
  - `api/`: Node.js socket server for real-time collaboration.
- **Diagram Engine:**  
  - Uses JointJS for rendering diagrams.
  - DBML parsing and export handled via custom logic and extensions in `web/src/proposed-extension/`.
- **Collaboration:**  
  - Real-time user presence and sync via WebSocket (`api/authServer.js` and `web/src/boot/socket.js`).
- **State Management:**  
  - Uses Pinia (`web/src/boot/pinia.js`) for Vue state management.
- **Internationalization:**  
  - i18n setup in `web/src/boot/i18n.js` and `web/src/i18n/`.

---

## Developer Workflows

- **Build & Dev:**
  - Run SPA locally:  
    ```
    cd web
    npm install
    quasar dev
    ```
  - Build for production:  
    ```
    quasar build
    ```
- **API Server:**
  - Start socket server:  
    ```
    cd api
    npm install
    node authServer.js
    ```
- **Linting:**  
  - ESLint config in `web/.eslintrc.js`.  
    ```
    npm run lint
    ```
- **No formal test suite detected.**  
  - Manual testing via local dev server.

---

## Project-Specific Conventions

- **Component Organization:**  
  - Diagram-related components in `web/src/components/VDbChart/` and `web/src/components/ace/`.
  - Editor logic in `web/src/components/DbmlEditor.vue` and `web/src/pages/Editor/`.
- **Custom DBML Syntax Highlighting:**  
  - See `web/public/mode-dbml.js` and `web/src/components/ace/dbml.js`.
- **Styling:**  
  - SCSS modules per feature in `web/src/css/`.
- **Socket Events:**  
  - Custom events for user sync; see `api/authServer.js` and `web/src/boot/socket.js`.

---

## Integration Points & External Dependencies

- **Quasar:** SPA framework for Vue.
- **JointJS:** Diagram rendering.
- **Ace Editor:** Embedded code editor for DBML.
- **Pinia:** State management.
- **WebSockets:** Real-time sync between API and web client.
- **DBML:** Custom parser and extensions for DBML format.

---

## Key Files & Directories (Detailed)

- **`web/src/components/DbmlEditor.vue`**  
  The main DBML code editor component. Integrates Ace Editor for syntax highlighting and editing DBML. Handles parsing, validation, and triggers diagram updates.

- **`web/src/components/VDbChart/`**  
  Contains all diagram rendering components using JointJS.  
  - `VDbChart.vue`: Main diagram canvas and logic.
  - `VDbTable.vue`, `VDbField.vue`, `VDbRef.vue`, etc.: Visual representations of tables, fields, and relationships.
  - `VDbTableGroup.vue`: Handles grouping tables visually.
  - `VDbTooltip.vue`: Custom tooltips for diagram elements.

- **`web/src/components/ace/`**  
  Custom Ace Editor modes and syntax files for DBML.  
  - `dbml.js`, `dbml_iro.js.nocompile`: Syntax highlighting and parsing rules.
  - `inline_annotation.js`: Inline error/warning annotations.

- **`web/src/proposed-extension/`**  
  Experimental and extended features for DBML parsing and diagram logic.  
  - `dbml-parser-extension.js`: Extends DBML parsing capabilities.
  - `DbmlGraphExtension.js`: Adds new diagram features.
  - `VDbRefUML.vue`: UML-style relationship rendering.

- **`web/src/store/`**  
  Pinia stores for managing application state.  
  - `chart.js`: State for diagram/chart data.
  - `editor.js`: State for DBML editor.
  - `files.js`: File management logic.
  - `users.js`: User presence and collaboration state.

- **`web/src/boot/socket.js`**  
  Initializes and manages WebSocket connections for real-time collaboration. Handles custom events for user sync and diagram updates.

- **`api/authServer.js`**  
  Node.js backend for WebSocket communication. Manages user sessions, broadcasts diagram changes, and handles collaboration logic.

- **`web/quasar.conf.js`**  
  Configuration for the Quasar framework, including build options, plugins, and boot files.

- **`web/src/i18n/`**  
  Internationalization files.  
  - `index.js`: i18n setup.
  - `en-US/index.js`: English translations.

- **`web/src/pages/Editor/`**  
  Editor page components.  
  - `Index.vue`: Main editor page.
  - `Toolbar.vue`: Editor toolbar actions.

- **`web/src/utils/`**  
  Utility functions for math, storage, and user management.

- **`web/src/css/`**  
  SCSS styles organized by feature/component.

---

**Tip:**  
When adding new features, locate the relevant directory by feature (e.g., diagram logic in `VDbChart/`, editor logic in `DbmlEditor.vue`, backend sync in `authServer.js`).  

---

**Feedback:**  
Please review and let me know if any sections need clarification or if there are missing patterns/workflows you use regularly.