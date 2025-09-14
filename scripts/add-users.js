#!/usr/bin/env node

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'your_database_name',
};

// Sample users to add (you can modify these)
const usersToAdd = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123'
  }
];

async function addUsersToDatabase() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Connected successfully!');
    
    // Check if users table exists and has password column
    console.log('Checking database schema...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
    
    if (tables.length === 0) {
      console.log('Creating users table...');
      await connection.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table created successfully!');
    } else {
      // Check if password column exists
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
      `);
      
      if (columns.length === 0) {
        console.log('Adding password column to users table...');
        await connection.execute('ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ""');
        console.log('Password column added successfully!');
      }
    }
    
    console.log('\nAdding users to database...');
    
    for (const user of usersToAdd) {
      try {
        // Check if user already exists
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [user.email]
        );
        
        if (existingUsers.length > 0) {
          console.log(`⚠️  User with email ${user.email} already exists, skipping...`);
          continue;
        }
        
        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        
        // Insert user
        const [result] = await connection.execute(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [user.name, user.email, hashedPassword]
        );
        
        const insertId = (result as any).insertId;
        console.log(`✅ Added user: ${user.name} (ID: ${insertId})`);
        
      } catch (error) {
        console.error(`❌ Error adding user ${user.name}:`, error.message);
      }
    }
    
    // Display all users in the database
    console.log('\n📋 Current users in database:');
    const [allUsers] = await connection.execute('SELECT id, name, email, created_at FROM users');
    
    if (allUsers.length === 0) {
      console.log('No users found in database.');
    } else {
      allUsers.forEach((user: any) => {
        console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Created: ${user.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('\nMake sure your database is running and environment variables are set correctly.');
    console.error('Required environment variables:');
    console.error('  - DB_HOST (default: localhost)');
    console.error('  - DB_USER (default: root)');
    console.error('  - DB_PASSWORD');
    console.error('  - DB_NAME');
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the script
addUsersToDatabase();
