# DB Diagram OSS (dbdiagram-oss)

An Open-Source dbdiagram.io with AI-powered schema generation

## 🚀 Quick Start

### 1. Install the dependencies
```bash
yarn
# or
npm install
```

### 2. Configure AI Services (Optional but Recommended)

Copy the environment template:
```bash
cp env.example .env
```

Edit `.env` and add your AI API keys:
```bash
# Google Gemini API Key (FREE - Get it at: https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_key_here

# OpenAI API Key (PAID - Get it at: https://platform.openai.com/api-keys)
OPENAI_API_KEY=your_openai_key_here  # Optional

# Default AI Provider
DEFAULT_AI_PROVIDER=gemini
```

**Note:** The AI chatbot will work automatically once you add the API keys to `.env`. No manual configuration required in the UI!

### 3. Start the app in development mode
```bash
quasar dev
```

The app will start on `http://localhost:3210`

## 🤖 AI Features

### Automatic Schema Generation
- **No setup required**: Just add your API key to `.env` and the chatbot works automatically
- **Context-aware**: Analyzes existing schema to avoid duplicates
- **Multi-provider**: Supports Gemini (free), OpenAI, and Ollama (local)
- **Image recognition**: Upload database diagrams and convert them to DBML

### How to Use the AI Chatbot
1. Click the chat icon in the editor
2. Type your request (e.g., "Create tables for users, roles, and permissions")
3. Click "Insert" to add generated DBML to your diagram

## 📦 Build for Production

```bash
quasar build
```

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI chatbot | No | - |
| `OPENAI_API_KEY` | OpenAI API key for AI chatbot | No | - |
| `DEFAULT_AI_PROVIDER` | Default AI provider (gemini/openai) | No | `gemini` |
| `API_BASE_URL` | Backend API URL | Yes | `http://localhost:3002/api` |
| `SOCKET_URL` | WebSocket server URL | Yes | `ws://localhost:3002` |

## 📖 Documentation

- [Production Setup](./PRODUCTION_SETUP.md)
- [API Keys Setup](./API_KEYS_SETUP.md)

### Lint the files
```bash
yarn lint
```

### Customize the configuration
See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).
