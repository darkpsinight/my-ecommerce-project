---
trigger: always_on
---

# Security & Secret Management Policy

## 1. Environment Variables
- **CRITICAL:** Never hard-code API keys, passwords, or secrets into any source code, test scripts, or documentation.
- All secrets must be accessed via `.env` files using `process.env` (Node) or equivalent environment loaders.
- In backend only, if needs to use .env key/value, read and import from backend\configs.js.

## 2. File Handling
- Before creating any file that might contain sensitive data, verify it is listed in the `.gitignore`.
- Do not print/log full environment variables or secrets to the console or logs.