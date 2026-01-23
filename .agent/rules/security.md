---
trigger: always_on
---

# Security & Secret Management Policy

## 1. Environment Variables (Hard Rule)

- **CRITICAL:** Secrets must never be hard-coded in source code, tests, scripts, or documentation.
- Backend code **must NOT** access `process.env` directly.
- `process.env` access is **EXCLUSIVELY ALLOWED** in:
  - `backend/configs.js`

### Required Pattern
- `backend/configs.js` is the **single source of truth** for all environment variables.
- All backend modules must import configuration values from `backend/configs.js`.
- No other backend file may reference `.env` or `process.env`.

Example (conceptual):
- ✅ `import { STRIPE_SECRET } from "../configs"`
- ❌ `process.env.STRIPE_SECRET`

Reading from `.env` is permitted **only** inside `backend/configs.js`.

---

## 2. File Handling & Git Hygiene

- Before creating any file that may contain sensitive data, verify it is covered by `.gitignore`.
- Never commit:
  - `.env`
  - credential dumps
  - tokens, private keys, secrets, or temporary auth files
- Do not log or print:
  - full environment variables
  - secret values
  - access tokens
  - private identifiers

---

## 3. Logging & Diagnostics

- Logs must be **redacted by default**.
- Secrets must never appear in:
  - console output
  - log files
  - error traces
  - test snapshots

---

## 4. Enforcement Rule (Agent)

Before writing or modifying backend code, the agent MUST:
1. Confirm whether configuration access is required
2. Route all configuration through `backend/configs.js`
3. Verify no `process.env` usage exists outside that file

If a violation is detected, **STOP and request correction**.
