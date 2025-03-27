const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initializeDatabase() {
    try {
        // Create user_consent table
        const createConsentTable = `
            CREATE TABLE IF NOT EXISTS user_consent (
                id INT AUTO_INCREMENT PRIMARY KEY,
                consent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                consent_text TEXT,
                consent_status BOOLEAN DEFAULT TRUE
            )
        `;

        await pool.query(createConsentTable);
        console.log('Created user_consent table successfully');

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

initializeDatabase(); 