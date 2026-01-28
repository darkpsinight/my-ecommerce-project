# 🧭 UPDATED & LOCKED ROADMAP (AUTHORITATIVE VERSION)
*(Starting from Step 24 — Major & Minor Steps Explicit)*

> Design principles:
> - Capability first, UI later
> - Financial authority exposed only after safety layers
> - Buyer UX never precedes support safety tooling
> - Backend / frontend parity required for authority steps

---

## 🔷 Step 24 — Admin & Support Authentication Hardening ✅ DONE

### Goal
Make Admin and Support dashboards session-safe, role-correct, and reliable before exposing any financial authority.

### 24.1 Backend
- 24.1.1 Access token TTL enforcement
- 24.1.2 Refresh token validation endpoint
- 24.1.3 Refresh token rotation (recommended)
- 24.1.4 Role claims enforcement:
  - `admin`
  - `support`

### 24.2 Frontend (REQUIRED)
- 24.2.1 Central auth state (store/context)
- 24.2.2 HTTP interceptor:
  - On 401 → refresh token → retry once
- 24.2.3 Silent refresh on:
  - App load
  - Route change / near-expiry
- 24.2.4 Forced logout only if refresh fails

### 24.3 Manual Tests
- Token expiry → silent refresh
- Invalid refresh → logout
- Multi-tab stability
- Role-restricted routes enforced

**Exit:** Stable Admin/Support sessions  
**Status:** ✅ DONE

---

## 🔷 Step 25 — Disputes, Escrow Control & Communication

> This step builds **all dispute and escrow authority**,  
> but intentionally **does NOT expose buyer dispute buttons yet**.

---

### 🟢 Step 25.1 — Dispute Creation & Escrow Freeze (Backend Capability) ✅ DONE

- Dispute records
- Escrow freeze on dispute creation
- Ledger invariants preserved

⚠️ **Important clarification**
- Buyer-facing “Open Dispute” button does **NOT** exist yet
- This step provides **capability only**, not UX

---

### 🟢 Step 25.2 — Dispute Core Backend Logic ✅ DONE
- Dispute state machine
- Escrow state transitions
- Idempotent logic
- No UI

---

### 🟢 Step 25.2.1 — Payout Integrity Stabilization (Backend Only) ✅ DONE
**(Blocking prerequisite before further dispute work)**

- Scheduler rewiring
- Deprecated payout service removal
- Identifier normalization (UUID vs ObjectId)
- Integrity monitor fixes
- Manual log verification

---

### 🟢 Step 25.3 — Buyer Wallet Ledger Foundation ✅ DONE
- Append-only ledger
- Buyer balances
- No spending allowed yet

---

### 🟢 Step 25.4 — Buyer ↔ Seller Order Chat (Pre-Dispute) ✅ DONE
- Order-scoped chat
- Locks when dispute exists
- No realtime
- UI issues (scroll, Tailwind visibility) resolved

---

### 🟡 Step 25.5 — Buyer Non-Financial Dispute Signals (Backend Only)

> **Capability exists, UI intentionally deferred**

Buyer signals supported at backend level:
- Escalate to support
- Mark dispute as resolved (signal only)

⚠️ Buyer cannot see or trigger these yet  
⚠️ No buyer dispute buttons in UI at this stage

---

### 🔴 Step 25.6 — Support / Admin Escrow & Dispute UI  
**(STEP A — CURRENT ACTIVE STEP)** 🚧

### Goal
Allow Support/Admin to resolve disputes **without database access**.

---

#### 25.6.1 Admin/Support READ APIs
- `GET /admin/disputes`
- `GET /admin/disputes/:disputeId`
- Includes:
  - Dispute metadata
  - Order snapshot
  - Buyer & seller info
  - Escrow state
  - Full chat history (read-only)

---

#### 25.6.2 Admin/Support ACTION APIs
- Release escrow
- Refund buyer
- Extend hold
- Idempotent
- Fully audited

---

#### 25.6.3 Support Dashboard UI
- Dispute list
- Filters/status
- Entry point to dispute detail

---

#### 25.6.4 Dispute Detail UI (Support/Admin)
Sections:
1. Dispute summary
2. Order snapshot
3. Buyer ↔ Seller chat (read-only)
4. Escrow action buttons (confirmation required)

---

#### 25.6.5 Verification
- Support resolves disputes without DB access
- Ledger updates verified
- Unauthorized users blocked

**Exit:**  
Support/Admin can fully and safely resolve disputes.

---

## 🔷 Step 26 — Wallet UX Consistency & Auto-Refresh ⏭️ NEXT

### 26.1 Frontend
- Wallet header auto-refresh:
  - Funding
  - Spending
  - Refunds
- Cross-page consistency:
  - Header
  - Wallet page
  - Checkout

### 26.2 Manual Tests
- No stale balances
- No manual refresh required

---

## 🔷 Step 27 — Seller Earnings Breakdown & Payout UX

### 27.1 Backend
- Ledger-based aggregation:
  - Gross / Fees / Net
  - Pending / Available / Paid

### 27.2 Frontend
- Seller dashboard
- Per-order earnings
- Payout history

---

## 🔷 Step 28 — Refunds & Reversals (Wallet + Card)

- Wallet → wallet refunds
- Escrow → wallet refunds
- Stripe card refunds
- Idempotent ledger entries
- Support refund UI

---

## 🔷 Step 29 — Dispute Lifecycle UI (Buyer + Support) ⭐ **BUYER DISPUTE UX LIVES HERE**

### Buyer UI (FIRST TIME buyer sees dispute buttons)
- Open dispute (from order page)
- View dispute timeline
- Dispute status visibility
- Escalate to support
- Mark dispute as resolved (signal only)

### Support UI
- Timeline view
- Resolution visibility
- Action history

⚠️ Financial authority remains **Support/Admin only**

---

## 🔷 Step 30 — KYC (Soft Enforcement)

- Visibility gates
- No hard blocking
- Payout gating only

---

## 🔷 Step 31 — Production Readiness

- Disable DEV paths
- Stripe webhook verification review
- Config validation
- Freeze financial logic & invariants

---

## 🔷 Step 32 — Buyer Frontend Redesign (Stitch AI)

- Escrow-first UX
- Dispute & chat UX
- Backend frozen

---

## 🔷 Step 33 — Seller Dashboard Redesign (Stitch AI)

- Earnings clarity
- Escrow impact visibility
- Mobile usability

---

## 🔷 Step 34 — Seller Analytics Rework & VIP Gating

- Correct metrics
- VIP tiers
- No financial truth behind paywalls
- No impact on payouts, escrow, or disputes
