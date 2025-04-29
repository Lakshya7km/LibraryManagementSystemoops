/**
 * DatabaseManager Class
 * Handles all database connections and basic query operations
 */
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

class DatabaseManager {
    constructor() {
        // Database configuration
        this.dbConfig = {
            host: process.env.DB_HOST || 'sql12.freesqldatabase.com',
            user: process.env.DB_USER || 'sql12775878',
            password: process.env.DB_PASSWORD || 'r33tT2EF5Y',
            database: process.env.DB_NAME || 'sql12775878',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        };

        // Create a connection pool
        this.pool = mysql.createPool(this.dbConfig);
        this.testConnection();
    }

    /**
     * Test the database connection
     */
    async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            console.log('Successfully connected to the database!');
            connection.release();
        } catch (err) {
            console.error('Error connecting to the database:', err);
            process.exit(1); // Exit if database connection fails
        }
    }

    /**
     * Execute a SQL query with parameters
     * @param {string} query - SQL query to execute
     * @param {Array} params - Parameters for the query
     * @returns {Promise} - Result of the query
     */
    async execute(query, params = []) {
        try {
            return await this.pool.execute(query, params);
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    /**
     * Get a connection from the pool (for transactions)
     * @returns {Promise} - Database connection
     */
    async getConnection() {
        try {
            return await this.pool.getConnection();
        } catch (error) {
            console.error('Error getting database connection:', error);
            throw error;
        }
    }
}

module.exports = DatabaseManager;
