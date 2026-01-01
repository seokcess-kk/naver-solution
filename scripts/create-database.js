const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to postgres database (default database)
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    const dbName = process.env.DB_DATABASE || 'naver_place_monitor';

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length > 0) {
      console.log(`Database '${dbName}' already exists`);
    } else {
      // Create database
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully`);
    }

    // Create uuid-ossp extension (needed for UUID generation)
    await client.end();

    // Connect to the newly created database to create extension
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    await dbClient.connect();
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('UUID extension enabled');
    await dbClient.end();

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating database:', error.message);
    process.exit(1);
  }
}

createDatabase();
