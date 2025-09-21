# Copilot Instructions for dbdiagram-oss

This guide enables AI coding agents to be productive in the dbdiagram-oss codebase. It summarizes architecture, workflows, conventions, and integration points specific to this project.

---

## Big Picture Architecture

- **Monorepo Structure:**
  - `web/`: Vue.js + Quasar SPA for diagram editing and visualization.
  - `api/`: Node.js socket server for real-time collaboration.
- **Diagram Engine:**
  - Uses JointJS for rendering diagrams.
  - DBML parsing and export handled via custom logic and extensions in `web/src/proposed-extension/`.
- **Collaboration:**
  - Real-time user presence and sync via WebSocket (`api/socketServer.js` and `web/src/boot/socket.js`).
- **State Management:**
  - Uses Pinia (`web/src/boot/pinia.js`) for Vue state management.
- **Internationalization:**
  - i18n setup in `web/src/boot/i18n.js` and `web/src/i18n/`.

---

## Developer Workflows

- **Build & Dev:**
  - Run SPA locally:
    ```bash
    cd web
    npm install
    quasar dev
    ```
  - Build for production:
    ```bash
    quasar build
    ```
- **API Server:**
  - Start socket server:
    ```bash
    cd api
    npm install
    node socketServer.js
    ```
- **Linting:**
  - ESLint config in `web/.eslintrc.js`.
    ```bash
    npm run lint
    ```
- **Manual Testing:**
  - No formal test suite. Test via local dev server.

---

## Project-Specific Conventions

- **Component Organization:**
  - Diagram components: `web/src/components/VDbChart/`, `web/src/components/ace/`
  - Editor logic: `web/src/components/DbmlEditor.vue`, `web/src/pages/Editor/`
- **Custom DBML Syntax Highlighting:**
  - See `web/public/mode-dbml.js`, `web/src/components/ace/dbml.js`
- **Styling:**
  - SCSS modules per feature in `web/src/css/`
- **Socket Events:**
  - Custom events for user sync; see `api/socketServer.js`, `web/src/boot/socket.js`

---

## Integration Points & External Dependencies

- **Quasar:** SPA framework for Vue
- **JointJS:** Diagram rendering
- **Ace Editor:** Embedded code editor for DBML
- **Pinia:** State management
- **WebSockets:** Real-time sync between API and web client
- **DBML:** Custom parser and extensions for DBML format

---

## Key Files & Directories

- `web/src/components/DbmlEditor.vue`: Main DBML code editor (Ace integration, parsing, diagram updates)
- `web/src/components/VDbChart/`: Diagram rendering components (JointJS)
- `web/src/components/ace/`: Ace Editor modes and syntax files
- `web/src/proposed-extension/`: Experimental DBML parsing/diagram features
- `web/src/store/`: Pinia stores for chart, editor, files, users
- `web/src/boot/socket.js`: WebSocket client logic
- `api/socketServer.js`: WebSocket server logic
- `web/quasar.conf.js`: Quasar config
- `web/src/i18n/`: i18n files
- `web/src/pages/Editor/`: Editor page components
- `web/src/utils/`: Utility functions
- `web/src/css/`: SCSS styles

---

**Tip:**
When adding new features, locate the relevant directory by feature (e.g., diagram logic in `VDbChart/`, editor logic in `DbmlEditor.vue`, backend sync in `socketServer.js`).

---

**Feedback:**
Please review and let me know if any sections need clarification or if there are missing patterns/workflows you use regularly.
