# Implementation Plan

- [x] 1. Set up payment service infrastructure and database schema

  - Create new database collections for stripe_accounts, payment_operations, webhook_events, and legacy_wallets
  - Add environment configuration for Stripe Connect keys and feature flags
  - Implement base payment adapter interface and error handling utilities
  - _Requirements: 1.1, 1.3, 8.1_

- [ ] 2. Implement Stripe Connect payment adapter
- [x] 2.1 Create core Stripe adapter service

  - Write stripeAdapter.ts with methods for account creation, payment intents, and transfers
  - Implement idempotency key generation and comprehensive logging
  - Add error handling with retry logic for Stripe API calls
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.2 Implement seller account management

  - Code createStripeAccountForSeller and createAccountLink methods
  - Write unit tests for account creation and link generation
  - Add validation for seller account requirements
  - _Requirements: 3.1, 3.2_

- [x] 2.3 Implement payment processing methods

  - Code createPaymentIntentOnPlatform and createTopUpIntent methods
  - Implement createTransferToSeller with fee calculation
  - Write unit tests for all payment processing methods
  - _Requirements: 4.1, 5.2, 6.1_

- [ ] 3. Create webhook handling system
- [x] 3.1 Implement webhook endpoint and event storage

  - Create POST /webhooks/stripe route with signature verification
  - Implement webhook event storage in webhook_events collection
  - Add raw event processing and normalization logic
  - _Requirements: 2.1, 2.2_

- [x] 3.2 Build webhook event processors

  - Code handlers for payment_intent.succeeded, transfer.created, and account.updated events
  - Implement idempotent event processing to prevent duplicates
  - Write unit tests for each webhook event type
  - _Requirements: 2.3, 2.5_

- [x] 3.3 Create reconciliation service




  - Implement reconcileStripe.ts job for balance verification
  - Code comparison logic between Stripe and database records

  - Add discrepancy reporting and manual review workflows
  - _Requirements: 2.4, 8.4_

- [ ] 4. Implement legacy wallet migration system
- [x] 4.1 Create legacy wallet bridge service




  - Write legacyWalletBridge.ts with methods for legacy balance management
  - Implement legacy balance spending and refund logic
  - Add migration utilities for converting legacy wallets
  - _Requirements: 4.2, 4.4, 8.1_

- [x] 4.2 Build wallet data migration script




  - Create migrate_legacy_wallets.js script to move existing wallet data
  - Implement data validation and integrity checks
  - Add rollback functionality for failed migrations
  - _Requirements: 4.2, 8.1, 8.2_

- [x] 4.3 Implement feature flag system for wallet flows




  - Add feature flag checks in wallet-related endpoints
  - Code logic to route between legacy and new wallet flows
  - Write tests for feature flag behavior
  - _Requirements: 1.4, 4.3, 8.3_

- [ ] 5. Update wallet and topup functionality
- [ ] 5.1 Modify wallet topup endpoints

  - Update POST /wallet/topup_request to use new payment adapter
  - Implement client_secret generation for Stripe Elements
  - Add legacy wallet balance display logic
  - _Requirements: 4.1, 4.3_

- [ ] 5.2 Update wallet balance management

  - Modify wallet service to handle both legacy and platform balances
  - Implement logic to spend legacy balance first in transactions
  - Write unit tests for combined balance handling
  - _Requirements: 4.4, 5.4_

- [ ] 6. Implement seller onboarding system
- [ ] 6.1 Create seller onboarding endpoints

  - Build GET /seller/:id/onboarding-link endpoint
  - Implement GET /seller/:id/stripe-status for KYC status checking
  - Add seller account creation and tracking logic
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6.2 Update seller dashboard integration

  - Add "Set up payments" button and onboarding flow
  - Implement KYC status display and verification progress
  - Write frontend components for seller payment setup
  - _Requirements: 3.4_

- [ ] 7. Update checkout and escrow system
- [ ] 7.1 Modify checkout process for platform-held escrow

  - Update POST /checkout to charge platform Stripe account, never sellers directly
  - Implement escrow creation that holds funds in platform account until delivery confirmation
  - Add product snapshot capture and delivery confirmation tracking
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 7.2 Implement delivery confirmation and escrow release system

  - Code buyer delivery confirmation endpoints and logic
  - Implement escrow release that transfers from platform account to seller Custom accounts
  - Add fee calculation and platform-to-seller transfer processing
  - _Requirements: 5.5, 6.1, 6.2_

- [ ] 8. Build dispute and refund system
- [ ] 8.1 Create dispute handling that prevents seller payouts

  - Implement POST /dispute endpoint that blocks escrow release to sellers
  - Add dispute evidence storage and admin notification system
  - Code dispute resolution that refunds from platform account before any seller payout
  - _Requirements: 7.1, 7.5_

- [ ] 8.2 Implement platform-controlled refund processing

  - Code refund handling that returns money from platform Stripe account to buyers
  - Implement legacy wallet refund processing with platform reserve adjustments
  - Add validation to ensure no seller payouts occur during active disputes
  - _Requirements: 7.2, 7.3, 7.4_

- [ ] 9. Create seller payout system
- [ ] 9.1 Implement payout endpoints and logic

  - Build POST /payouts endpoint for manual seller payouts
  - Implement available balance calculation and payout processing
  - Add payout request tracking and status management
  - _Requirements: 6.4, 6.5_

- [ ] 9.2 Update seller dashboard for payout management

  - Add available balance and pending balance display
  - Implement "Request payout" button and payout history
  - Write frontend components for payout management
  - _Requirements: 6.5_

- [ ] 10. Update admin and support interfaces
- [ ] 10.1 Enhance admin dashboard for payment management

  - Add seller verification status and migration tracking displays
  - Implement dispute management interface with funding source awareness
  - Create admin tools for manual wallet migration and reconciliation
  - _Requirements: 3.5, 7.4, 8.4_

- [ ] 10.2 Build audit and monitoring systems

  - Implement audit logging for all payment operations and admin actions
  - Add monitoring dashboards for payment success rates and webhook processing
  - Create alerting for payment failures and data consistency issues
  - _Requirements: 7.5, 8.5_

- [ ] 11. Implement comprehensive testing suite
- [ ] 11.1 Create unit tests for payment services

  - Write tests for all payment adapter methods with mocked Stripe responses
  - Test legacy wallet bridge functionality and migration logic
  - Add tests for webhook processing and event normalization
  - _Requirements: 1.1, 1.2, 2.1, 4.2_

- [ ] 11.2 Build integration tests for payment flows

  - Create end-to-end tests for wallet topup, checkout, and payout flows
  - Test webhook handling with simulated Stripe events
  - Add tests for feature flag toggling between legacy and new systems
  - _Requirements: 4.1, 5.1, 6.1, 8.3_

- [ ] 12. Deploy and validate migration
- [ ] 12.1 Execute data migration and validation

  - Run legacy wallet migration script with data integrity checks
  - Validate migrated data against original records
  - Test backward compatibility with existing user balances
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 12.2 Enable new payment flows and monitor
  - Gradually enable feature flags for new payment processing
  - Monitor payment success rates and webhook processing performance
  - Validate reconciliation between Stripe and database records
  - _Requirements: 2.4, 8.3, 8.4_
