# Database Scripts

This folder contains utility scripts for database operations, specifically for managing and querying users with their roles.

## Scripts Overview

### 1. `getUsersWithRoles.js`
Basic script to connect to the database and retrieve all users with their roles.

**Usage:**
```bash
node backend/scripts/database/getUsersWithRoles.js
```

**Features:**
- Connects to MongoDB using configuration from `configs.js`
- Retrieves all active users (excludes deactivated users)
- Displays users in a formatted table with roles, email confirmation status, and creation date
- Shows role statistics and email confirmation summary
- Can be imported as a module for use in other scripts

### 2. `advancedUserQuery.js`
Advanced script with filtering, searching, and export capabilities.

**Usage:**
```bash
# Basic usage - show all users
node backend/scripts/database/advancedUserQuery.js

# Filter by role
node backend/scripts/database/advancedUserQuery.js --role admin

# Filter by email confirmation status
node backend/scripts/database/advancedUserQuery.js --email-confirmed false

# Search users by name or email
node backend/scripts/database/advancedUserQuery.js --search "john"

# Limit results
node backend/scripts/database/advancedUserQuery.js --limit 10

# Include deactivated users
node backend/scripts/database/advancedUserQuery.js --include-deactivated

# Export to JSON
node backend/scripts/database/advancedUserQuery.js --export json

# Export to CSV with custom filename
node backend/scripts/database/advancedUserQuery.js --role seller --export csv --filename sellers.csv

# Show help
node backend/scripts/database/advancedUserQuery.js --help
```

**Available Options:**
- `--role <role>`: Filter by role (buyer, seller, admin, support)
- `--email-confirmed <bool>`: Filter by email confirmation status (true/false)
- `--provider <provider>`: Filter by auth provider (email, google)
- `--include-deactivated`: Include deactivated users in results
- `--limit <number>`: Limit number of results
- `--search <term>`: Search in name and email fields
- `--export <format>`: Export to file (json, csv)
- `--filename <name>`: Custom export filename
- `--help`: Show help message

### 3. `dbUtils.js`
Utility module providing reusable database functions for user management.

**Usage as Module:**
```javascript
const { dbUtils } = require('./backend/scripts/database/dbUtils');

// Get all users with roles
const users = await dbUtils.getAllUsersWithRoles();

// Get users by specific role
const admins = await dbUtils.getUsersByRole('admin');

// Get user statistics
const stats = await dbUtils.getUserStats();

// Search users
const results = await dbUtils.searchUsers('john');

// Don't forget to disconnect
await dbUtils.disconnect();
```

**Available Methods:**
- `getAllUsersWithRoles()`: Get all active users with their roles
- `getUsersByRole(role)`: Get users with a specific role
- `getUsersByRoles(roles)`: Get users with any of the specified roles
- `getUserCountByRole()`: Get count of users grouped by role
- `getUnconfirmedUsers()`: Get users with unconfirmed emails
- `getRecentUsers(days)`: Get recently registered users
- `getUserStats()`: Get comprehensive user statistics
- `searchUsers(searchTerm)`: Search users by name or email
- `getUsersWithWallets()`: Get users who have wallet information
- `formatUsersForDisplay(users)`: Format user data for display
- `printUsersTable(users, title)`: Print users in a formatted table

## Database Schema

The scripts work with the User model which includes:

- `name`: User's full name
- `email`: User's email address
- `roles`: Array of roles (buyer, seller, admin, support)
- `isEmailConfirmed`: Boolean indicating email confirmation status
- `provider`: Authentication provider (email, google, etc.)
- `isDeactivated`: Boolean indicating if user is deactivated
- `walletId`: Reference to user's wallet
- `stripeCustomerId`: Stripe customer ID for payments
- `createdAt`: User creation timestamp

## Export Formats

### JSON Export
Exports users to a JSON file with the following structure:
```json
{
  "exportDate": "2025-01-08T10:30:00.000Z",
  "totalUsers": 150,
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "roles": ["buyer", "seller"],
      "isEmailConfirmed": true,
      "provider": "email",
      "isDeactivated": false,
      "hasWallet": true,
      "hasStripe": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### CSV Export
Exports users to a CSV file with columns:
- ID, Name, Email, Roles, Email Confirmed, Provider, Deactivated, Has Wallet, Has Stripe, Created At

## Examples

### Get all admin users
```bash
node backend/scripts/database/advancedUserQuery.js --role admin
```

### Find users who haven't confirmed their email
```bash
node backend/scripts/database/advancedUserQuery.js --email-confirmed false
```

### Export all sellers to CSV
```bash
node backend/scripts/database/advancedUserQuery.js --role seller --export csv --filename sellers_report.csv
```

### Search for specific user
```bash
node backend/scripts/database/advancedUserQuery.js --search "john.doe@example.com"
```

### Get recent registrations (last 7 days) and export to JSON
```bash
node backend/scripts/database/advancedUserQuery.js --export json --filename recent_users.json
```

## Error Handling

All scripts include proper error handling and will:
- Display clear error messages if database connection fails
- Gracefully handle missing or invalid data
- Ensure database connections are properly closed
- Exit with appropriate status codes

## Requirements

- Node.js environment
- MongoDB connection configured in `backend/.env` file
- Required dependencies: mongoose, dotenv
- Proper environment variables set in `.env` file (specifically `MONGO_URI`)

## Security Notes

- Scripts respect the existing user privacy settings
- Sensitive fields like passwords are not included in queries
- Export files are created in a local `exports` directory
- Always ensure proper access controls when running these scripts in production
##
 Additional Files

### `dbConnection.js`
Utility module for database connection management that avoids circular dependencies.

### `userModel.js`
Simplified User model for database scripts that avoids circular dependencies with the main application configs.

## Troubleshooting

### Circular Dependency Warning
If you see warnings about circular dependencies, the scripts have been updated to use isolated database connection and user model files to avoid this issue.

### Database Connection Issues
- Ensure your `MONGO_URI` is properly set in the `backend/.env` file
- Check that your MongoDB Atlas cluster is accessible
- Verify your network connection and firewall settings

### Permission Issues
- Make sure the database user has read permissions
- Check that your IP address is whitelisted in MongoDB Atlas (if using cloud database)