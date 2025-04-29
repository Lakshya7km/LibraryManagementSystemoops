/**
 * FineCalculator Class
 * Handles all fine-related operations, including calculation and management
 */
class FineCalculator {
    /**
     * Initialize FineCalculator with database manager
     * @param {DatabaseManager} dbManager - Instance of DatabaseManager
     */
    constructor(dbManager) {
        this.db = dbManager;
        this.fineRate = 5; // ₹5 per day
        this.gracePeriod = 7; // 7 days grace period
    }

    /**
     * Calculate fine for an overdue book
     * @param {Date} issueDate - Date the book was issued
     * @param {Date} returnDate - Date the book is being returned (default: today)
     * @returns {Object} - Fine details including amount and days overdue
     */
    calculateFine(issueDate, returnDate = new Date()) {
        const issueDateTime = new Date(issueDate);
        const returnDateTime = new Date(returnDate);
        
        const daysIssued = Math.floor((returnDateTime - issueDateTime) / (1000 * 60 * 60 * 24));
        const daysOverdue = Math.max(0, daysIssued - this.gracePeriod); // Apply grace period
        const fineAmount = daysOverdue * this.fineRate;
        
        return {
            daysIssued,
            daysOverdue,
            fineAmount,
            hasFine: fineAmount > 0
        };
    }

    /**
     * Return a book and calculate any applicable fine
     * @param {number} issueId - Issue ID of the book
     * @returns {Object} - Result of returning book with fine details
     */
    async returnBook(issueId) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            // Get issue details
            const [issues] = await connection.execute(
                'SELECT * FROM issued_books WHERE issue_id = ?',
                [issueId]
            );

            if (issues.length === 0) {
                await connection.rollback();
                return { success: false, message: 'Issue record not found' };
            }

            const issue = issues[0];
            if (issue.status === 'returned') {
                await connection.rollback();
                return { success: false, message: 'This book has already been returned' };
            }

            // Calculate fine
            const fineDetails = this.calculateFine(issue.issue_date);

            // Update issued_books record
            await connection.execute(
                'UPDATE issued_books SET return_date = CURDATE(), status = "returned", fine_amount = ? WHERE issue_id = ?',
                [fineDetails.fineAmount, issueId]
            );

            // Update book available quantity
            await connection.execute(
                'UPDATE books SET available_quantity = available_quantity + 1 WHERE book_id = ?',
                [issue.book_id]
            );

            await connection.commit();
            return { 
                success: true, 
                message: 'Book returned successfully',
                fine: fineDetails.fineAmount,
                daysOverdue: fineDetails.daysOverdue
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error in returnBook:', error);
            return { success: false, message: 'Failed to return book: ' + error.message };
        } finally {
            connection.release();
        }
    }

    /**
     * Get students with fines or pending books
     * @returns {Object} - Students with fines and summary statistics
     */
    async getStudentsWithFines() {
        try {
            // Get all students with issued books or fines
            const [students] = await this.db.execute(`
                SELECT 
                    s.student_id,
                    s.username,
                    s.name,
                    s.email,
                    COALESCE(SUM(ib.fine_amount), 0) as total_fines,
                    COUNT(CASE WHEN ib.status = 'issued' THEN 1 END) as pending_books
                FROM students s
                LEFT JOIN issued_books ib ON s.student_id = ib.student_id
                GROUP BY s.student_id
                HAVING pending_books > 0 OR total_fines > 0
                ORDER BY total_fines DESC, pending_books DESC
            `);
            
            // Calculate totals
            let totalFines = 0;
            let totalPendingBooks = 0;
            
            students.forEach(student => {
                totalFines += parseFloat(student.total_fines) || 0;
                totalPendingBooks += parseInt(student.pending_books) || 0;
            });
            
            return {
                students,
                total_fines: totalFines,
                total_pending_books: totalPendingBooks
            };
        } catch (error) {
            console.error('Error in getStudentsWithFines:', error);
            return { students: [], total_fines: 0, total_pending_books: 0 };
        }
    }
}

module.exports = FineCalculator;
