# Database User Management

This directory contains scripts to add users to your MySQL database with properly hashed passwords.

## Setup

1. **Create environment file**: Copy `env.example` to `.env` and update with your database credentials:
   ```bash
   cp env.example .env
   ```

2. **Update `.env` with your database settings**:
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_database_name
   ```

## Adding Users

### Method 1: Using npm script (Recommended)
```bash
npm run add-users
```

### Method 2: Direct execution
```bash
# TypeScript version
npx tsx scripts/add-users.ts

# JavaScript version
node scripts/add-users.js
```

## What the script does

1. **Connects to your MySQL database** using the environment variables
2. **Checks/creates the users table** with proper schema including password field
3. **Adds sample users** with hashed passwords:
   - John Doe (john@example.com / password123)
   - Jane Smith (jane@example.com / password123)
   - Admin User (admin@example.com / admin123)
4. **Skips existing users** to avoid duplicates
5. **Displays all current users** in the database

## Customizing Users

Edit the `usersToAdd` array in `scripts/add-users.ts` to add your own users:

```typescript
const usersToAdd: User[] = [
  {
    name: 'Your Name',
    email: 'your@email.com',
    password: 'your_password'
  },
  // Add more users here...
];
```

## Security Notes

- Passwords are hashed using bcryptjs with 12 salt rounds
- Never commit your `.env` file to version control
- The script will skip users that already exist (by email)
- All database operations use prepared statements to prevent SQL injection

## Troubleshooting

If you get connection errors:
1. Make sure MySQL is running
2. Check your database credentials in `.env`
3. Ensure the database exists
4. Verify your user has proper permissions

## Database Schema

The script creates/updates the users table with this structure:
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
