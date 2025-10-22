# Copilot Instructions for dbdiagram-oss

Open-source alternative to dbdiagram.io for collaborative database diagram editing using DBML. Built with Vue 3 + Quasar (frontend) and Node.js + Socket.IO (backend).

---

## Architecture Overview

**Monorepo with separated concerns:**
- `web/`: Vue 3 + Quasar SPA — DBML editing, JointJS diagram rendering, real-time collaboration UI
- `api/`: Node.js backend — JWT auth, WebSocket rooms, PostgreSQL persistence

**Key data flows:**
1. DBML text → `@dbml/core` parser → JointJS diagram elements → visual rendering
2. Local edits → WebSocket broadcast → room members receive updates → apply to their diagram
3. User actions (table drag, relationship type change) → debounced socket events → broadcast to room

**Authentication:** JWT tokens stored in localStorage; validated via middleware on both HTTP (Express) and WebSocket (Socket.IO handshake)

**State management:** Pinia stores (`auth`, `room`) manage user sessions and room membership. Editor state kept separate in `web/src/store/editor.js`.

---

## Developer Workflows

**Start development:**
```bash
# Terminal 1 - API server (requires PostgreSQL running)
cd api
npm install
cp .env.example .env  # Configure DB credentials
npm run init-db       # Run schema.sql
npm run dev           # Starts authServer.js with nodemon

# Terminal 2 - Web client
cd web
npm install
quasar dev            # Starts on localhost:3210
```

**Production build:**
```bash
cd web
quasar build          # Outputs to dist/spa/
```

**Database setup:** PostgreSQL required. Run `api/database/schema.sql` to create `users`, `rooms`, `room_members` tables. Connection config in `api/config/database.js`.

**No automated tests:** Manual testing via local dev server and test HTML files (`api/test-websocket.html`, `web/test-ai.html`).

---

## Critical Patterns & Conventions

**WebSocket sync architecture (avoid infinite loops):**
- `DbmlEditor.vue` uses `isRemoteUpdate` flag to prevent echo when applying remote changes
- Debounce high-frequency events (table dragging) with `isDragging` flag; only persist on drop
- Client emits `join-room` with `room_code` + `room_password`; server validates and broadcasts `room-joined` with initial state

**Socket event naming convention:**
- `join-room`, `leave-room`, `dbml-update`, `table-position-update`, `tablegroup-position-update`, `relationship-type-update`
- Server broadcasts same event name back to all room members except sender (using `socket.id` comparison)

**Pinia stores usage:**
- `useAuthStore()`: Login/logout, JWT management, user profile
- `useRoomStore()`: Room CRUD, WebSocket connection lifecycle, member list
- Import stores inside actions to avoid circular dependencies: `import { useAuthStore } from './auth.js'` at bottom of file

**Custom DBML syntax extensions:**
- Base parsing via `@dbml/core`, custom UML relationship operators in `web/src/proposed-extension/`
- Ace editor mode defined in `web/public/mode-dbml.js` for syntax highlighting
- Inline annotations for DBML errors: `web/src/components/ace/inline_annotation.js`

**AI Service integration (multi-provider):**
- `web/src/services/aiService.js` abstracts Gemini (free), OpenAI, and Ollama
- API keys stored in localStorage (`ai_gemini_key`) or env vars (`GEMINI_API_KEY`)
- Generates DBML from natural language prompts; strict output validation to prevent XSS in editor

**Boot files execution order (critical):**
- `web/quasar.conf.js` boot array: `['i18n', 'ace', 'pinia', 'axios', 'v3num', 'socket']`
- Pinia must init before socket.js (which may reference stores)
- Socket boot file (`web/src/boot/socket.js`) creates singleton connection; exposes methods as `app.config.globalProperties.$socket`

**Environment-specific config:**
- `web/quasar.conf.js` build.env injects `API_BASE_URL` and `SOCKET_URL` from process.env or defaults
- `web/src/config/socket.config.js` switches between dev (localhost:3003) and production WebSocket URLs

---

## Key Files for Common Tasks

**Adding new DBML features:**
- Parser logic: `web/src/proposed-extension/dbml-parser-extension.js`
- Diagram rendering: `web/src/components/VDbChart/VDbChart.vue` (main canvas), `VDbTable.vue`, `VDbRef.vue`
- DBML editor: `web/src/components/DbmlEditor.vue` (Ace integration, sync control)

**Modifying real-time collaboration:**
- Client-side WebSocket: `web/src/boot/socket.js` (exported functions like `sendDiagramUpdate`)
- Server-side logic: `api/socketServer.js` or `api/authServer.js` (Socket.IO event handlers)
- Room state persistence: `api/models/Room.js` (PostgreSQL queries via `pg` module)

**Authentication changes:**
- Frontend: `web/src/stores/auth.js` (Pinia actions for login/register)
- Backend: `api/routes/auth.js` (Express endpoints), `api/middleware/auth.js` (JWT verification)
- WebSocket auth: `api/middleware/socketAuth.js` (validates token in Socket.IO handshake)

**AI prompt engineering:**
- System prompts: `web/src/services/aiService.js` (see `DBML_SYSTEM_PROMPTS` constant)
- Provider switching: `aiService.switchProvider('gemini' | 'openai' | 'ollama')`

**Styling diagram elements:**
- SCSS by feature: `web/src/css/VDbChart/`, `web/src/css/_jointjs.scss`, `web/src/css/_dbml-graph.scss`
- Quasar theme vars: `web/src/css/quasar.variables.scss`

---

## Gotchas & Debugging Tips

1. **CORS errors in dev:** Check `api/authServer.js` and `api/socketServer.js` CORS config includes `http://localhost:3210`
2. **Database connection failures:** Verify PostgreSQL is running; check `api/.env` credentials match your local setup
3. **WebSocket won't connect:** Confirm `SOCKET_URL` env var matches actual server address; check browser console for auth token issues
4. **Diagram not updating on remote edits:** Ensure `isRemoteUpdate = true` is set before applying changes in `DbmlEditor.vue`
5. **AI service returns mock data:** Check browser localStorage for API keys; fallback triggers when keys missing or API fails
6. **Infinite update loops:** Review event emission logic; never emit socket events inside socket event handlers without sender filtering

---

## External Dependencies & Docs

- [Quasar Framework](https://quasar.dev/) — Vue 3 SPA framework
- [JointJS](https://www.jointjs.com/docs/jointjs) — Diagram library (note: using open-source version, not commercial Rappid)
- [@dbml/core](https://www.dbml.org/home/) — DBML parser/importer/exporter
- [Ace Editor](https://ace.c9.io/) — Code editor with custom DBML mode
- [Socket.IO](https://socket.io/docs/v4/) — WebSocket library for real-time sync
- [Pinia](https://pinia.vuejs.org/) — Vue 3 state management
