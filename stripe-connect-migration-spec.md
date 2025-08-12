# Stripe Connect Migration Spec

This document provides a quick reference to the comprehensive Stripe Connect migration specification.

## Overview

Migration from unified Stripe account to Stripe Connect with Custom accounts for proper escrow handling and legal compliance.

## Key Flow

1. **Buyer Payment** → Platform Stripe Account (escrow)
2. **Product Delivery** → Buyer confirms receipt
3. **Escrow Release** → Platform transfers to Seller Custom Account
4. **Disputes** → Refund from platform account (no seller payout)

## Specification Files

- **Requirements**: `.kiro/specs/stripe-connect-migration/requirements.md`
- **Design**: `.kiro/specs/stripe-connect-migration/design.md`
- **Tasks**: `.kiro/specs/stripe-connect-migration/tasks.md`

## Next Steps

To begin implementation:
1. Open `.kiro/specs/stripe-connect-migration/tasks.md`
2. Start with task 1: "Set up payment service infrastructure and database schema"
3. Click "Start task" next to each task item to begin implementation

## Key Components

- Payment Service Adapter (`/backend/src/services/payment/stripeAdapter.ts`)
- Legacy Wallet Bridge (`/backend/src/services/payment/legacyWalletBridge.ts`)
- Webhook Handler (`/backend/src/routes/webhooks/stripe.ts`)
- Reconciliation Service (`/backend/src/jobs/reconcileStripe.ts`)

## Database Changes

- New collections: `stripe_accounts`, `payment_operations`, `webhook_events`, `legacy_wallets`
- Modified collections: `escrows` (funding_source), `wallets` (source field)

## Migration Strategy

1. Infrastructure setup with feature flags
2. Data migration (preserve existing balances)
3. New flow implementation
4. Legacy deprecation

The specification ensures backward compatibility while implementing proper escrow handling through platform-controlled Stripe accounts.