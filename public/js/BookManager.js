/**
 * BookManager Class (Frontend)
 * Handles book-related operations in the frontend for student users
 */
class BookManager {
    /**
     * Initialize BookManager for frontend operations
     * @param {Object} tableSelectors - HTML selectors for tables
     */
    constructor(tableSelectors = {}) {
        this.availableBooksTable = tableSelectors.availableBooks || '#availableBooks';
        this.issuedBooksTable = tableSelectors.issuedBooks || '#issuedBooks';
    }

    /**
     * Load and display available books
     * @returns {Promise<Array>} - List of books loaded
     */
    async loadAvailableBooks() {
        try {
            const response = await fetch('/api/books');
            if (!response.ok) {
                throw new Error('Failed to fetch books');
            }
            
            const books = await response.json();
            const tbody = document.querySelector(this.availableBooksTable);
            tbody.innerHTML = '';
            
            if (books.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            <div class="alert alert-info">
                                No books are currently available in the library.
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                books.forEach(book => {
                    tbody.innerHTML += `
                        <tr>
                            <td>${book.isbn}</td>
                            <td>${book.title}</td>
                            <td>${book.author}</td>
                            <td>${book.available_quantity}/${book.quantity}</td>
                            <td>
                                <button class="btn btn-primary btn-sm issue-book-btn" data-book-id="${book.book_id}">
                                    Issue Book
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                // Add event listeners to issue buttons
                document.querySelectorAll('.issue-book-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const bookId = e.target.getAttribute('data-book-id');
                        this.issueBook(bookId);
                    });
                });
            }
            
            return books;
        } catch (error) {
            console.error('Error loading available books:', error);
            document.querySelector(this.availableBooksTable).innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="alert alert-danger">
                            Error loading books. Please try again later.
                        </div>
                    </td>
                </tr>
            `;
            return [];
        }
    }

    /**
     * Load and display issued books for the current student
     * @returns {Promise<Array>} - List of issued books loaded
     */
    async loadIssuedBooks() {
        try {
            const response = await fetch('/api/student/issued-books');
            if (!response.ok) {
                throw new Error('Failed to fetch issued books');
            }
            
            const books = await response.json();
            const tbody = document.querySelector(this.issuedBooksTable);
            tbody.innerHTML = '';
            
            if (books.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <div class="alert alert-info">
                                You have not issued any books yet.
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                books.forEach(book => {
                    // Calculate current fine if book is still issued
                    let fineDisplay = '';
                    if (book.status === 'issued') {
                        const issueDate = new Date(book.issue_date);
                        const today = new Date();
                        const daysIssued = Math.floor((today - issueDate) / (1000 * 60 * 60 * 24));
                        const daysOverdue = Math.max(0, daysIssued - 7);
                        const currentFine = daysOverdue * 5;
                        
                        fineDisplay = currentFine > 0 ? 
                            `<span class="text-danger">₹${currentFine} (Pending)</span>` : 
                            'No fine yet';
                    } else {
                        fineDisplay = book.fine_amount > 0 ? 
                            `<span class="text-danger">₹${book.fine_amount}</span>` : 
                            'No fine';
                    }
                    
                    tbody.innerHTML += `
                        <tr>
                            <td>${book.isbn || 'N/A'}</td>
                            <td>${book.title || 'N/A'}</td>
                            <td>${new Date(book.issue_date).toLocaleDateString()}</td>
                            <td>${book.return_date ? new Date(book.return_date).toLocaleDateString() : 'Not returned'}</td>
                            <td>
                                <span class="badge ${book.status === 'issued' ? 'bg-warning' : 'bg-success'}">
                                    ${book.status === 'issued' ? 'Issued' : 'Returned'}
                                </span>
                            </td>
                            <td>${fineDisplay}</td>
                        </tr>
                    `;
                });
            }
            
            return books;
        } catch (error) {
            console.error('Error loading issued books:', error);
            document.querySelector(this.issuedBooksTable).innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="alert alert-danger">
                            Error loading issued books. Please try again later.
                        </div>
                    </td>
                </tr>
            `;
            return [];
        }
    }

    /**
     * Issue a book to the current student
     * @param {number} bookId - ID of the book to issue
     * @returns {Promise<Object>} - Result of issuing the book
     */
    async issueBook(bookId) {
        try {
            const response = await fetch('/api/issue-book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bookId }),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Success: ' + result.message);
                // Reload books to show the changes
                await this.loadAvailableBooks();
                await this.loadIssuedBooks();
                return { success: true, message: result.message };
            } else {
                alert('Error: ' + result.error);
                return { success: false, message: result.error };
            }
        } catch (error) {
            console.error('Error issuing book:', error);
            alert('Error issuing book. Please try again later.');
            return { success: false, message: 'Error issuing book' };
        }
    }

    /**
     * Return a book
     * @param {number} bookId - ID of the book to return
     * @returns {Promise<Object>} - Result of returning the book
     */
    async returnBook(bookId) {
        try {
            const response = await fetch('/api/return-book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bookId }),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                let message = result.message;
                if (result.fine) {
                    message += '\n' + result.fine;
                }
                alert('Success: ' + message);
                // Reload books to show the changes
                await this.loadAvailableBooks();
                await this.loadIssuedBooks();
                return { success: true, message: message };
            } else {
                alert('Error: ' + result.error);
                return { success: false, message: result.error };
            }
        } catch (error) {
            console.error('Error returning book:', error);
            alert('Error returning book. Please try again later.');
            return { success: false, message: 'Error returning book' };
        }
    }
}

// Export for ES modules or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookManager;
} else {
    window.BookManager = BookManager;
}
