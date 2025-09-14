#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'your_database_name',
};

async function checkTableStructure() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Connected successfully!');
    
    // Check table structure
    console.log('\n📋 Users table structure:');
    const [columns] = await connection.execute('DESCRIBE users');
    
    console.table(columns);
    
    // Check current users
    console.log('\n👥 Current users in database:');
    const [users] = await connection.execute('SELECT id, name, email FROM users');
    
    if ((users as any[]).length === 0) {
      console.log('No users found in database.');
    } else {
      console.table(users);
    }
    
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

checkTableStructure().catch(console.error);
