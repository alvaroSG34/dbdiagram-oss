# API Configuration for dbdiagram-oss ChatPanel

## Getting Started

1. **Copy this file** to `api-config.local.js` (which is ignored by git)
2. **Add your API keys** below
3. **Restart the development server**

## Google Gemini (Free Option)
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Replace YOUR_GEMINI_API_KEY below

## OpenAI (Paid Option)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Replace YOUR_OPENAI_API_KEY below

## Example configuration:

```javascript
// api-config.local.js
export const API_CONFIG = {
  gemini: 'YOUR_GEMINI_API_KEY_HERE',
  openai: 'YOUR_OPENAI_API_KEY_HERE'
}
```

## Usage in ChatPanel
The ChatPanel will automatically load these keys and store them in localStorage for convenience.

## Security Note
- Never commit your actual API keys to version control
- The `api-config.local.js` file is ignored by git for security
- Keys are stored in localStorage for development convenience only