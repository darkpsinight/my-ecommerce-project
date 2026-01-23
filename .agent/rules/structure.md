---
trigger: always_on
---

# Global Project Structure & Organization Policy

This document defines **mandatory, non-negotiable rules** for file and folder creation.
Any deviation must be explicitly approved and documented.

---

## 1. Root-Level Invariants (Hard Rules)

### 1.1 No Flat Root Rule
- **PROHIBITED:** Creating logic files directly under the project root.
- **ALLOWED at root only:**
  - Environment & tooling configs (`.env`, `.env.example`)
  - Package managers & build tools (`package.json`, `pnpm-lock.yaml`)
  - Entry documentation (`README.md`, `LICENSE`)
  - CI/CD configs (`.github/`, `.gitignore`)

### 1.2 Generated Output Isolation
- Logs, reports, dumps, traces, and diagnostics **must never** live beside source code.
- Mandatory destinations:
  - `/logs/`
  - `/tmp/`
  - `/artifacts/`
- If missing, create the directory explicitly.

---

## 2. Architectural Layering (Mandatory Separation)

All code **must belong to exactly one layer**.

/domain → Pure business rules (no IO, no frameworks)
/application → Use-cases, workflows, orchestration
/infrastructure→ External systems (DB, Stripe, email, queues)
/interfaces → HTTP, CLI, Admin UI, Webhooks


### Dependency Rules (Strict)
- `domain` → depends on nothing
- `application` → may depend on `domain`
- `infrastructure` → may depend on `application` + `domain`
- `interfaces` → may depend on all layers
- **Reverse dependencies are forbidden**

---

## 3. Feature & Module Organization (Scalability Rule)

### 3.1 Feature-First, Never File-First
- **PROHIBITED:** Single files inside category folders.
- **REQUIRED:** Every feature gets its own folder.

❌ /jobs/reconcileStripe.js
✅ /jobs/reconcile-stripe/reconcile-stripe.ts


### 3.2 Feature Folder Structure (Canonical)
Each feature folder must follow this pattern:

feature-name/
├─ index.ts # public exports only
├─ handler.ts # entry point
├─ service.ts # internal logic
├─ types.ts # local types only
├─ tests/
│ └─ feature-name.ts
└─ README.md # optional but recommended


---

## 4. Lifecycle-Based Segregation

| Concern | Mandatory Location |
|------|-------------------|
| Runtime logic | `/domain`, `/application` |
| Background jobs / cron | `/jobs/<job-name>/` |
| One-off scripts | `/scripts/<script-name>/` |
| Database migrations | `/migrations/<timestamp>-<name>/` |
| Admin / internal tools | `/admin/<tool-name>/` |
| Experiments / spikes | `/experiments/<name>/` |

**Runtime code must NEVER import from `/scripts`, `/experiments`, or `/admin`.**

---

## 5. Naming Conventions (Non-Negotiable)

- **Folders:** lowercase, kebab-case
- **Files:** camelCase or kebab-case (match local convention)
- **Jobs:** `<feature>.job.ts`
- **Handlers:** `<feature>.handler.ts` (Handler context is implied by folder)
- **Services:** `<feature>.ts` (service context is implied by folder)
- **Tests:** `*.test.ts` or `*.spec.ts`

---

## 6. Test Structure Rules

- Tests must **mirror the source structure**.
- Tests live **next to the feature**, never globally unless shared.
- Every feature with logic **must** have at least one test or a documented exemption.

---

## 7. Growth & Refactor Thresholds

A folder **must be split** if:
- It exceeds ~10 files, or
- It contains multiple unrelated responsibilities.

When splitting:
- Create sub-features
- Introduce a shared internal module only if duplication is proven

---

## 8. Pre-Implementation Enforcement (Agent Rule)

Before creating or modifying files, the agent MUST:
1. Declare the **exact absolute path**
2. Justify the **chosen layer**
3. Confirm **dependency direction is respected**
4. Verify no root or category-level violations occur

If any rule conflicts, **STOP and request clarification**.

---

## 9. Rule Hierarchy

Priority order:
1. This document
2. Local folder `README.md`
3. Tooling defaults

Lower-priority rules may not override higher ones.