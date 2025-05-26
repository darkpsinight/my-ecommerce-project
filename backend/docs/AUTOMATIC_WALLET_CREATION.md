# Automatic Wallet Creation During Email Verification

## Overview
Implemented automatic wallet creation during the email verification process. When a user's email verification status changes from `isEmailConfirmed: false` to `isEmailConfirmed: true`, a wallet is automatically created and linked to the user.

## Implementation Details

### Trigger Points
Automatic wallet creation occurs in two authentication handlers:

1. **`confirmEmail`** - When user clicks email confirmation link
2. **`loginWithEmail`** - When user uses passwordless email login

### Files Modified

#### 1. `backend/handlers/authenticationHandler.js`
- **Added**: Wallet model import
- **Modified**: `confirmEmail` function to include automatic wallet creation
- **Modified**: `loginWithEmail` function to include automatic wallet creation

#### 2. `backend/models/wallet.js`
- **Enhanced**: `createWalletForUser` method with better error handling and idempotency

### Key Features

#### ✅ **Automatic Trigger**
- Wallet creation triggers when `isEmailConfirmed` transitions from `false` to `true`
- Only creates wallet on first-time email confirmation (idempotent)

#### ✅ **Configuration**
- Uses `configs.WALLET_DEFAULT_CURRENCY` (defaults to 'USD')
- Initial balance: 0
- Uses existing `Wallet.createWalletForUser()` method

#### ✅ **User Model Integration**
- Links created wallet to user via `user.walletId` field
- Maintains referential integrity between User and Wallet models

#### ✅ **Error Handling**
- Wallet creation failure doesn't prevent email confirmation
- Comprehensive error logging for debugging
- Graceful fallback if wallet creation fails

#### ✅ **Idempotency**
- Checks if user already has a wallet before creating new one
- Prevents duplicate wallet creation
- Safe to run multiple times

#### ✅ **Multi-Role Support**
- Works for all user roles (buyer, seller, admin)
- Supports the multi-role system implementation
- Sellers can access wallet features through buyer role

## Code Examples

### Email Confirmation with Wallet Creation
```javascript
const confirmEmail = async (request, reply) => {
  const user = request.userModel;
  
  // Check if this is the first time email is being confirmed
  const wasEmailUnconfirmed = !user.isEmailConfirmed;
  
  user.isEmailConfirmed = true;
  await user.save({ validateBeforeSave: false });

  // Automatically create wallet if email was just confirmed for the first time
  if (wasEmailUnconfirmed) {
    try {
      if (!user.walletId) {
        const wallet = await Wallet.createWalletForUser(
          user._id, 
          configs.WALLET_DEFAULT_CURRENCY || 'USD'
        );
        
        user.walletId = wallet._id;
        await user.save({ validateBeforeSave: false });
      }
    } catch (walletError) {
      // Log error but continue with email confirmation
      request.log.error({
        msg: "Failed to create wallet during email confirmation",
        error: walletError.message,
        userId: user._id,
        email: user.email
      });
    }
  }
  
  // Continue with normal email confirmation flow...
};
```

### Enhanced Wallet Creation Method
```javascript
walletSchema.statics.createWalletForUser = async function(userId, currency = "USD") {
  try {
    // First check if wallet already exists
    const existingWallet = await this.findOne({ userId });
    if (existingWallet) {
      return existingWallet;
    }
    
    const wallet = new this({
      userId,
      currency,
      externalId: uuidv4()
    });
    
    return await wallet.save();
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      const existingWallet = await this.findOne({ userId });
      if (existingWallet) {
        return existingWallet;
      }
      throw new Error(`Wallet creation failed due to duplicate key error`);
    }
    throw error;
  }
};
```

## Database Considerations

### Index Cleanup
- **Issue**: Removed problematic legacy indexes from wallets collection
- **Solution**: Created cleanup script `backend/scripts/cleanupWalletIndexes.js`
- **Indexes Removed**: All `transactions.*` related indexes that were causing conflicts

### Current Wallet Indexes
- `_id_`: Primary key
- `userId_1`: User reference (unique)
- `externalId_1`: External identifier (unique)
- `isActive_1`: Status filtering

## Testing

### Test Scripts Created
1. **`backend/tests/autoWalletCreation-test.js`** - Comprehensive automatic wallet creation tests
2. **`backend/tests/simpleWalletTest.js`** - Basic wallet creation debugging
3. **`backend/scripts/checkDatabaseIndexes.js`** - Database index inspection
4. **`backend/scripts/cleanupWalletIndexes.js`** - Index cleanup utility

### Test Results ✅
- ✅ Wallet created automatically on email confirmation
- ✅ Wallet properly linked to user via `walletId`
- ✅ Idempotency maintained (no duplicate wallets)
- ✅ Works for all user roles (buyer, seller, admin)
- ✅ Wallet accessible via existing API methods
- ✅ Error handling doesn't break email confirmation
- ✅ Backend starts successfully with changes

## API Impact

### Wallet Access
All wallet endpoints now support the enhanced user base:
- `GET /api/v1/wallet/` - Get wallet information
- `POST /api/v1/wallet/payment-intent` - Create payment intent
- `POST /api/v1/wallet/confirm-payment` - Confirm payment
- `GET /api/v1/wallet/transactions` - Get transaction history

### Role Support
- **Buyers**: Automatic wallet creation on email confirmation
- **Sellers**: Automatic wallet creation + access to wallet features
- **Admins**: Automatic wallet creation + comprehensive access

## Configuration

### Environment Variables
```bash
WALLET_DEFAULT_CURRENCY=USD  # Default currency for new wallets
```

### Default Values
- **Currency**: USD (if not configured)
- **Initial Balance**: 0
- **Status**: Active (isActive: true)

## Migration Notes

### For Existing Users
- Users who already confirmed emails won't get automatic wallets
- Manual wallet creation still available via existing API endpoints
- No breaking changes to existing functionality

### For New Users
- All new user registrations will get wallets upon email confirmation
- Seamless integration with existing authentication flow
- No additional frontend changes required

## Monitoring & Logging

### Success Logs
```
Creating wallet for newly confirmed user: user@example.com
Wallet created successfully for user: user@example.com, walletId: 507f1f77bcf86cd799439011
```

### Error Logs
```
Failed to create wallet during email confirmation
- error: [error message]
- userId: [user ID]
- email: [user email]
```

## Future Enhancements

### Potential Improvements
1. **Batch Processing**: Handle bulk user migrations
2. **Webhook Integration**: Notify external systems of wallet creation
3. **Custom Currency**: Allow per-user currency preferences
4. **Initial Funding**: Promotional balance for new users
5. **Analytics**: Track wallet creation metrics

### Backward Compatibility
- All existing functionality preserved
- No breaking changes to API contracts
- Existing users continue to work unchanged
