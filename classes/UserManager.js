/**
 * UserManager Class
 * Handles user authentication, registration, and profile management
 */
const bcrypt = require('bcrypt');

class UserManager {
    /**
     * Initialize UserManager with database manager
     * @param {DatabaseManager} dbManager - Instance of DatabaseManager
     */
    constructor(dbManager) {
        this.db = dbManager;
    }

    /**
     * Register a new student
     * @param {string} username - Student username
     * @param {string} password - Student password
     * @param {string} name - Student name
     * @param {string} email - Student email
     * @returns {Object} - Result of registration
     */
    async registerStudent(username, password, name, email) {
        try {
            // Check if username or email already exists
            const [users] = await this.db.execute(
                'SELECT student_id FROM students WHERE username = ? OR email = ?',
                [username, email]
            );

            if (users.length > 0) {
                return { success: false, message: 'Username or email already exists' };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new student
            await this.db.execute(
                'INSERT INTO students (username, password, name, email, created_at) VALUES (?, ?, ?, ?, CURDATE())',
                [username, hashedPassword, name, email]
            );

            return { success: true, message: 'Registration successful' };
        } catch (error) {
            console.error('Error in registerStudent:', error);
            return { success: false, message: 'Registration failed' };
        }
    }

    /**
     * Verify student credentials
     * @param {string} username - Student username
     * @param {string} password - Student password
     * @returns {Object|null} - Student data if verified, null otherwise
     */
    async verifyStudent(username, password) {
        try {
            const [students] = await this.db.execute(
                'SELECT student_id, password, name, email FROM students WHERE username = ?',
                [username]
            );

            if (students.length === 0) {
                return null;
            }

            const student = students[0];
            const passwordMatch = await bcrypt.compare(password, student.password);

            if (!passwordMatch) {
                return null;
            }

            return {
                id: student.student_id,
                name: student.name,
                email: student.email
            };
        } catch (error) {
            console.error('Error in verifyStudent:', error);
            return null;
        }
    }

    /**
     * Get student profile data
     * @param {number} studentId - Student ID
     * @returns {Object|null} - Student profile data
     */
    async getStudentProfile(studentId) {
        try {
            const [students] = await this.db.execute(
                'SELECT username, name, email, created_at FROM students WHERE student_id = ?',
                [studentId]
            );

            return students.length > 0 ? students[0] : null;
        } catch (error) {
            console.error('Error in getStudentProfile:', error);
            return null;
        }
    }
}

module.exports = UserManager;
