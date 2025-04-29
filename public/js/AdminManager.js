/**
 * AdminManager Class
 * Handles admin-specific operations in the frontend
 */
class AdminManager {
    /**
     * Initialize AdminManager for frontend operations
     * @param {Object} tableSelectors - HTML selectors for tables
     */
    constructor(tableSelectors = {}) {
        this.booksTable = tableSelectors.books || '#booksTable tbody';
        this.issuedBooksTable = tableSelectors.issuedBooks || '#issuedBooksTable tbody';
        this.finesTable = tableSelectors.fines || '#finesTable tbody';
    }

    /**
     * Load and display all books (admin view)
     * @returns {Promise<Array>} - List of books loaded
     */
    async loadBooks() {
        try {
            const response = await fetch('/api/admin/books');
            if (!response.ok) {
                throw new Error('Failed to fetch books');
            }
            
            const books = await response.json();
            const tbody = document.querySelector(this.booksTable);
            tbody.innerHTML = '';
            
            if (books.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            <div class="alert alert-info">No books in the library.</div>
                        </td>
                    </tr>
                `;
            } else {
                books.forEach(book => {
                    tbody.innerHTML += `
                        <tr>
                            <td>${book.book_id}</td>
                            <td>${book.isbn}</td>
                            <td>${book.title}</td>
                            <td>${book.author}</td>
                            <td>${book.quantity}</td>
                            <td>${book.available_quantity}</td>
                            <td>
                                <button class="btn btn-sm btn-primary edit-book" data-book-id="${book.book_id}">Edit</button>
                            </td>
                        </tr>
                    `;
                });
                
                // Add event listeners for edit buttons
                document.querySelectorAll('.edit-book').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const bookId = e.target.getAttribute('data-book-id');
                        this.getBookDetails(bookId);
                    });
                });
            }
            
            return books;
        } catch (error) {
            console.error('Error loading books:', error);
            document.querySelector(this.booksTable).innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="alert alert-danger">Error loading books. Please try again later.</div>
                    </td>
                </tr>
            `;
            return [];
        }
    }

    /**
     * Get book details for editing
     * @param {number} bookId - ID of the book to edit
     */
    async getBookDetails(bookId) {
        try {
            const response = await fetch(`/api/admin/books/${bookId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch book details');
            }
            
            const book = await response.json();
            
            // Fill the edit form
            document.getElementById('editBookId').value = book.book_id;
            document.getElementById('editIsbn').value = book.isbn;
            document.getElementById('editTitle').value = book.title;
            document.getElementById('editAuthor').value = book.author;
            document.getElementById('editQuantity').value = book.quantity;
            document.getElementById('editAvailable').value = book.available_quantity;
            
            // Show the modal
            new bootstrap.Modal(document.getElementById('editBookModal')).show();
        } catch (error) {
            console.error('Error getting book details:', error);
            alert('Error loading book details. Please try again.');
        }
    }

    /**
     * Add a new book
     * @param {Object} bookData - Book data (isbn, title, author, quantity)
     * @returns {Promise<Object>} - Result of adding the book
     */
    async addBook(bookData) {
        try {
            const response = await fetch('/api/admin/books/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookData),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Success: ' + result.message);
                await this.loadBooks();
                return { success: true, message: result.message };
            } else {
                alert('Error: ' + result.error);
                return { success: false, message: result.error };
            }
        } catch (error) {
            console.error('Error adding book:', error);
            alert('Error adding book. Please try again later.');
            return { success: false, message: 'Error adding book' };
        }
    }

    /**
     * Edit an existing book
     * @param {Object} bookData - Book data (book_id, isbn, title, author, quantity, available_quantity)
     * @returns {Promise<Object>} - Result of editing the book
     */
    async editBook(bookData) {
        try {
            const response = await fetch('/api/admin/books/edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookData),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Success: ' + result.message);
                await this.loadBooks();
                return { success: true, message: result.message };
            } else {
                alert('Error: ' + result.error);
                return { success: false, message: result.error };
            }
        } catch (error) {
            console.error('Error editing book:', error);
            alert('Error editing book. Please try again later.');
            return { success: false, message: 'Error editing book' };
        }
    }

    /**
     * Load and display all issued books (admin view)
     * @returns {Promise<Array>} - List of issued books
     */
    async loadIssuedBooks() {
        try {
            const response = await fetch('/api/admin/issued-books');
            if (!response.ok) {
                throw new Error('Failed to fetch issued books');
            }
            
            const books = await response.json();
            const tbody = document.querySelector(this.issuedBooksTable);
            tbody.innerHTML = '';
            
            if (books.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <div class="alert alert-info">No books have been issued.</div>
                        </td>
                    </tr>
                `;
            } else {
                books.forEach(book => {
                    const issueDate = new Date(book.issue_date).toLocaleDateString();
                    const returnDate = book.return_date ? new Date(book.return_date).toLocaleDateString() : 'Not returned';
                    const fine = book.fine_amount > 0 ? `₹${book.fine_amount}` : 'No fine';
                    
                    tbody.innerHTML += `
                        <tr>
                            <td>${book.issue_id}</td>
                            <td>${book.title} (ISBN: ${book.isbn})</td>
                            <td>${book.student_name} (${book.username})</td>
                            <td>${issueDate}</td>
                            <td>${returnDate}</td>
                            <td>
                                <span class="badge ${book.status === 'issued' ? 'bg-warning' : 'bg-success'}">
                                    ${book.status === 'issued' ? 'Issued' : 'Returned'}
                                </span>
                            </td>
                            <td>${fine}</td>
                            <td>
                                ${book.status === 'issued' ? `
                                <button class="btn btn-primary btn-sm return-book" data-issue-id="${book.issue_id}">
                                    Return
                                </button>` : ''}
                            </td>
                        </tr>
                    `;
                });
                
                // Add event listeners for return buttons
                document.querySelectorAll('.return-book').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const issueId = e.target.getAttribute('data-issue-id');
                        this.returnBook(issueId);
                    });
                });
            }
            
            return books;
        } catch (error) {
            console.error('Error loading issued books:', error);
            document.querySelector(this.issuedBooksTable).innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="alert alert-danger">Error loading issued books. Please try again later.</div>
                    </td>
                </tr>
            `;
            return [];
        }
    }

    /**
     * Return a book (admin function)
     * @param {number} issueId - ID of the issue to process
     * @returns {Promise<Object>} - Result of returning the book
     */
    async returnBook(issueId) {
        try {
            const response = await fetch('/api/admin/books/return', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ issue_id: issueId }),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                let message = result.message;
                if (result.fine) {
                    message += '\n' + result.fine;
                }
                alert('Success: ' + message);
                await this.loadIssuedBooks();
                await this.loadFines();
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

    /**
     * Load and display fines data
     * @returns {Promise<Object>} - Fines data with students and totals
     */
    async loadFines() {
        try {
            const response = await fetch('/api/admin/fines');
            if (!response.ok) {
                throw new Error('Failed to fetch fines data');
            }
            
            const data = await response.json();
            const tbody = document.querySelector(this.finesTable);
            tbody.innerHTML = '';
            
            if (data.students.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            <div class="alert alert-info">No pending fines or books.</div>
                        </td>
                    </tr>
                `;
            } else {
                data.students.forEach(student => {
                    tbody.innerHTML += `
                        <tr>
                            <td>${student.username}</td>
                            <td>${student.name}</td>
                            <td>${student.email}</td>
                            <td>₹${parseFloat(student.total_fines).toFixed(2)}</td>
                            <td>${student.pending_books}</td>
                        </tr>
                    `;
                });
            }
            
            // Update totals
            document.getElementById('totalFinesAmount').textContent = `₹${data.total_fines.toFixed(2)}`;
            document.getElementById('totalPendingBooks').textContent = data.total_pending_books;
            
            return data;
        } catch (error) {
            console.error('Error loading fines data:', error);
            document.querySelector(this.finesTable).innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="alert alert-danger">Error loading fines data. Please try again later.</div>
                    </td>
                </tr>
            `;
            return { students: [], total_fines: 0, total_pending_books: 0 };
        }
    }
}

// Export for ES modules or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminManager;
} else {
    window.AdminManager = AdminManager;
}
