/**
 * BookManager Class
 * Manages all book-related operations including adding, editing, issuing and returning books
 */
class BookManager {
    /**
     * Initialize BookManager with database manager
     * @param {DatabaseManager} dbManager - Instance of DatabaseManager
     */
    constructor(dbManager) {
        this.db = dbManager;
    }

    /**
     * Get all books (admin)
     * @returns {Array} - List of all books
     */
    async getAllBooks() {
        try {
            const [books] = await this.db.execute('SELECT * FROM books ORDER BY title');
            return books;
        } catch (error) {
            console.error('Error in getAllBooks:', error);
            return [];
        }
    }

    /**
     * Get available books (books with quantity > 0)
     * @returns {Array} - List of available books
     */
    async getAvailableBooks() {
        try {
            const [books] = await this.db.execute(
                'SELECT * FROM books WHERE available_quantity > 0'
            );
            return books;
        } catch (error) {
            console.error('Error in getAvailableBooks:', error);
            return [];
        }
    }

    /**
     * Get a book by ID
     * @param {number} bookId - Book ID
     * @returns {Object|null} - Book details
     */
    async getBookById(bookId) {
        try {
            const [books] = await this.db.execute(
                'SELECT * FROM books WHERE book_id = ?',
                [bookId]
            );
            return books.length > 0 ? books[0] : null;
        } catch (error) {
            console.error('Error in getBookById:', error);
            return null;
        }
    }

    /**
     * Add a new book
     * @param {string} isbn - Book ISBN
     * @param {string} title - Book title
     * @param {string} author - Book author
     * @param {number} quantity - Book quantity
     * @returns {Object} - Result of adding book
     */
    async addBook(isbn, title, author, quantity) {
        try {
            // Check if ISBN already exists
            const [existingBooks] = await this.db.execute(
                'SELECT * FROM books WHERE isbn = ?',
                [isbn]
            );
            
            if (existingBooks.length > 0) {
                return { success: false, message: 'A book with this ISBN already exists' };
            }
            
            // Add the book
            await this.db.execute(
                'INSERT INTO books (isbn, title, author, quantity, available_quantity) VALUES (?, ?, ?, ?, ?)',
                [isbn, title, author, quantity, quantity]
            );
            
            return { success: true, message: 'Book added successfully' };
        } catch (error) {
            console.error('Error in addBook:', error);
            return { success: false, message: 'Failed to add book' };
        }
    }

    /**
     * Edit an existing book
     * @param {number} bookId - Book ID
     * @param {string} isbn - Book ISBN
     * @param {string} title - Book title
     * @param {string} author - Book author
     * @param {number} quantity - Book quantity
     * @param {number} availableQuantity - Available quantity
     * @returns {Object} - Result of editing book
     */
    async editBook(bookId, isbn, title, author, quantity, availableQuantity) {
        try {
            // Check if book exists
            const [existingBooks] = await this.db.execute(
                'SELECT * FROM books WHERE book_id = ?',
                [bookId]
            );
            
            if (existingBooks.length === 0) {
                return { success: false, message: 'Book not found' };
            }
            
            // Check if ISBN already exists for another book
            const [isbnCheck] = await this.db.execute(
                'SELECT * FROM books WHERE isbn = ? AND book_id != ?',
                [isbn, bookId]
            );
            
            if (isbnCheck.length > 0) {
                return { success: false, message: 'Another book with this ISBN already exists' };
            }
            
            // Check if available_quantity is not greater than quantity
            if (availableQuantity > quantity) {
                return { success: false, message: 'Available quantity cannot be greater than total quantity' };
            }
            
            // Update the book
            await this.db.execute(
                'UPDATE books SET isbn = ?, title = ?, author = ?, quantity = ?, available_quantity = ? WHERE book_id = ?',
                [isbn, title, author, quantity, availableQuantity, bookId]
            );
            
            return { success: true, message: 'Book updated successfully' };
        } catch (error) {
            console.error('Error in editBook:', error);
            return { success: false, message: 'Failed to update book' };
        }
    }

    /**
     * Issue a book to a student
     * @param {number} studentId - Student ID
     * @param {number} bookId - Book ID
     * @returns {Object} - Result of issuing book
     */
    async issueBook(studentId, bookId) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            // Check if book is available
            const [books] = await connection.execute(
                'SELECT available_quantity FROM books WHERE book_id = ?',
                [bookId]
            );

            if (books.length === 0 || books[0].available_quantity <= 0) {
                await connection.rollback();
                return { success: false, message: 'Book not available' };
            }

            // Check if student already has this book
            const [issuedBooks] = await connection.execute(
                'SELECT issue_id FROM issued_books WHERE student_id = ? AND book_id = ? AND status = "issued"',
                [studentId, bookId]
            );

            if (issuedBooks.length > 0) {
                await connection.rollback();
                return { success: false, message: 'You have already issued this book' };
            }

            // Issue the book
            await connection.execute(
                'INSERT INTO issued_books (student_id, book_id, issue_date, status) VALUES (?, ?, CURDATE(), "issued")',
                [studentId, bookId]
            );

            // Update available quantity
            await connection.execute(
                'UPDATE books SET available_quantity = available_quantity - 1 WHERE book_id = ?',
                [bookId]
            );

            await connection.commit();
            return { success: true, message: 'Book issued successfully' };
        } catch (error) {
            await connection.rollback();
            console.error('Error in issueBook:', error);
            return { success: false, message: 'Failed to issue book' };
        } finally {
            connection.release();
        }
    }

    /**
     * Get issued books for a student
     * @param {number} studentId - Student ID
     * @returns {Array} - List of issued books
     */
    async getIssuedBooks(studentId) {
        try {
            const [issuedBooks] = await this.db.execute(`
                SELECT 
                    ib.*,
                    b.title,
                    b.author,
                    b.isbn
                FROM issued_books ib
                JOIN books b ON ib.book_id = b.book_id
                WHERE ib.student_id = ?
                ORDER BY ib.issue_date DESC
            `, [studentId]);
            
            return issuedBooks;
        } catch (error) {
            console.error('Error in getIssuedBooks:', error);
            return [];
        }
    }

    /**
     * Get all issued books (for admin)
     * @returns {Array} - List of all issued books
     */
    async getAllIssuedBooks() {
        try {
            const [issuedBooks] = await this.db.execute(`
                SELECT 
                    ib.*,
                    b.title,
                    b.isbn,
                    s.username,
                    s.name as student_name,
                    s.email
                FROM issued_books ib
                JOIN books b ON ib.book_id = b.book_id
                JOIN students s ON ib.student_id = s.student_id
                ORDER BY ib.issue_date DESC
            `);
            
            return issuedBooks;
        } catch (error) {
            console.error('Error in getAllIssuedBooks:', error);
            return [];
        }
    }
}

module.exports = BookManager;
