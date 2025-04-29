const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Import our OOP classes
const { dbManager, userManager, bookManager, fineCalculator } = require('./classes');


dotenv.config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration - MUST be before routes that use sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'library_management_secret_key',
    resave: false,
    saveUninitialized: true, // Changed to true to ensure new sessions are saved
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
    },
    name: 'library_session',
    rolling: true
}));

// Debug middleware to verify session is working
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    next();
});

// Default route to serve login page
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    next();
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login.html');
    }
    next();
};

// Routes

// Student Registration
app.post('/register', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        
        // Use the UserManager class to register the student
        const result = await userManager.registerStudent(username, password, name, email);
        
        if (result.success) {
            res.redirect('/login.html?registered=1');
        } else {
            console.error('Registration failed:', result.message);
            res.redirect('/register.html?error=1');
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.redirect('/register.html?error=1');
    }
});

// Student Login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', { username });
        
        // Check if it's admin login
        if (username === 'admin' && password === 'admin') {
            req.session.user = {
                id: 0,
                name: 'Admin',
                role: 'admin'
            };
            req.session.save((err) => {
                if (err) console.error('Session save error:', err);
                console.log('Admin session saved:', req.session);
                return res.redirect('/admin_dashboard.html');
            });
            return;
        }

        // Regular student login - using the UserManager class
        const student = await userManager.verifyStudent(username, password);
        console.log('Student verification result:', student);

        if (student) {
            // Student credentials are valid
            req.session.user = {
                id: student.id,
                name: student.name,
                role: 'student',
                email: student.email
            };
            req.session.save((err) => {
                if (err) console.error('Session save error:', err);
                console.log('Student session saved:', req.session);
                res.redirect('/dashboard.html');
            });
        } else {
            // Invalid credentials
            console.log('Invalid student credentials');
            res.redirect('/login.html?error=1');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/login.html?error=1');
    }
});

// Admin Login
app.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.execute(
            'SELECT * FROM admins WHERE email = ?',
            [email]
        );

        if (rows.length > 0 && await bcrypt.compare(password, rows[0].password)) {
            req.session.user = {
                id: rows[0].id,
                name: rows[0].name,
                role: 'admin'
            };
            res.redirect('/admin_dashboard.html');
        } else {
            res.redirect('/admin_login.html?error=1');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.redirect('/admin_login.html?error=1');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login.html');
    });
});

// Get available books
app.get('/api/books', requireLogin, async (req, res) => {
    try {
        // Use the BookManager class to get available books
        const books = await bookManager.getAvailableBooks();
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// Issue a book
app.post('/api/issue-book', requireLogin, async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.session.user.id;
        
        console.log('Book issue request:', { userId, bookId });
        
        // Use the BookManager class to handle the transaction
        const result = await bookManager.issueBook(userId, bookId);
        
        console.log('Book issue result:', result);
        
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }
        
        res.json({ message: result.message });
    } catch (error) {
        console.error('Error issuing book:', error);
        res.status(500).json({ error: 'Failed to issue book: ' + error.message });
    }
});

// Return a book
app.post('/api/return-book', requireLogin, async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.session.user.id;
        
        console.log('Book return request:', { userId, bookId });
        
        // First, get the issue_id for this book and student
        const [issue] = await dbManager.execute(
            'SELECT issue_id FROM issued_books WHERE book_id = ? AND student_id = ? AND status = "issued"',
            [bookId, userId]
        );
        
        if (issue.length === 0) {
            return res.status(404).json({ error: 'No active issue found for this book' });
        }
        
        const issueId = issue[0].issue_id;
        console.log('Found issue_id:', issueId);
        
        // Use the FineCalculator class to handle the transaction
        const result = await fineCalculator.returnBook(issueId);
        
        console.log('Book return result:', result);
        
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }
        
        res.json({
            message: result.message,
            fine: result.fine > 0 ? `Fine of ₹${result.fine.toFixed(2)} applied for ${result.daysOverdue} days overdue` : 'No fine applied'
        });
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(500).json({ error: 'Failed to return book: ' + error.message });
    }
});

// Get student's issued books
app.get('/api/student/issued-books', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        // Use the BookManager class to get issued books
        const books = await bookManager.getIssuedBooks(userId);
        res.json(books);
    } catch (error) {
        console.error('Error fetching issued books:', error);
        res.status(500).json({ error: 'Failed to fetch issued books' });
    }
});

// Get student profile
app.get('/api/student/profile', async (req, res) => {
    try {
        // Check if the user is logged in first without redirecting
        if (!req.session.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userId = req.session.user.id;
        console.log('Fetching profile for user ID:', userId);
        
        // If this is an admin user, return admin data
        if (req.session.user.role === 'admin') {
            return res.json({
                username: 'admin',
                name: req.session.user.name,
                email: 'admin@library.com',
                role: 'admin',
                created_at: new Date(),
                issued_books_count: 0,
                total_fines: 0
            });
        }

        // For student users, get profile from UserManager
        const profile = await userManager.getStudentProfile(userId);
        
        // Get issued books count and fines
        const issuedBooks = await bookManager.getIssuedBooks(userId);
        const issuedCount = issuedBooks.filter(book => book.status === 'issued').length;
        const totalFines = issuedBooks.reduce((sum, book) => sum + (book.fine_amount || 0), 0);
        
        // If no profile found but we have session user data, return basic profile
        if (!profile) {
            console.log('No profile found in database but session exists');
            return res.json({
                username: req.session.user.username || 'student',
                name: req.session.user.name,
                email: req.session.user.email || 'No email available',
                role: req.session.user.role,
                created_at: new Date(),
                issued_books_count: issuedCount,
                total_fines: totalFines
            });
        }

        console.log('Profile found:', profile);
        res.json({
            username: profile.username,
            name: profile.name,
            email: profile.email,
            created_at: profile.created_at,
            issued_books_count: issuedCount,
            total_fines: totalFines
        });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ error: 'Failed to fetch student profile' });
    }
});

// Get available books
app.get('/api/books', async (req, res) => {
    try {
        const [books] = await db.execute(
            'SELECT * FROM books WHERE available_quantity > 0'
        );
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// Get all books (for admin)
app.get('/api/admin/books', async (req, res) => {
    try {
        // Verify admin role
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        
        // Use BookManager class to get all books
        const books = await bookManager.getAllBooks();
        res.json(books);
    } catch (error) {
        console.error('Error fetching all books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// Get a specific book by ID (for admin)
app.get('/api/admin/books/:id', async (req, res) => {
    try {
        // Verify admin role
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        
        // Use BookManager class to get book by ID
        const book = await bookManager.getBookById(req.params.id);
        
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json(book);
    } catch (error) {
        console.error('Error fetching book details:', error);
        res.status(500).json({ error: 'Failed to fetch book details' });
    }
});

// Add a new book (admin)
app.post('/api/admin/books/add', async (req, res) => {
    try {
        // Verify admin role
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        
        const { isbn, title, author, quantity } = req.body;
        
        // Validate input
        if (!isbn || !title || !author || !quantity || quantity < 1) {
            return res.status(400).json({ error: 'All fields are required and quantity must be at least 1' });
        }
        
        // Use BookManager class to add a book
        const result = await bookManager.addBook(isbn, title, author, quantity);
        
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }
        
        res.status(201).json({ message: result.message });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

// Edit a book (admin)
app.post('/api/admin/books/edit', async (req, res) => {
    try {
        // Verify admin role
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        
        const { book_id, isbn, title, author, quantity, available_quantity } = req.body;
        
        // Validate input
        if (!book_id || !isbn || !title || !author || !quantity || quantity < 1 || available_quantity < 0) {
            return res.status(400).json({ error: 'All fields are required with valid values' });
        }
        
        // Use BookManager class to edit a book
        const result = await bookManager.editBook(book_id, isbn, title, author, quantity, available_quantity);
        
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }
        
        res.json({ message: result.message });
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

// Get issued books for a student
app.get('/api/student/issued-books', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const userId = req.session.user.id;
        
        const [issuedBooks] = await db.execute(`
            SELECT 
                ib.*,
                b.title,
                b.author,
                b.isbn
            FROM issued_books ib
            JOIN books b ON ib.book_id = b.book_id
            WHERE ib.student_id = ?
            ORDER BY ib.issue_date DESC
        `, [userId]);
        
        res.json(issuedBooks);
    } catch (error) {
        console.error('Error fetching issued books:', error);
        res.status(500).json({ error: 'Failed to fetch issued books' });
    }
});

// Get all issued books (admin)
app.get('/api/admin/issued-books', async (req, res) => {
    try {
        // Verify admin role
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        
        // Use BookManager class to get all issued books
        const issuedBooks = await bookManager.getAllIssuedBooks();
        
        res.json(issuedBooks);
    } catch (error) {
        console.error('Error fetching all issued books:', error);
        res.status(500).json({ error: 'Failed to fetch issued books' });
    }
});

// Return a book (admin)
app.post('/api/admin/books/return', async (req, res) => {
    try {
        // Verify admin role
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        
        const { issue_id } = req.body;
        
        console.log('Return book request received for issue_id:', issue_id);
        
        if (!issue_id) {
            return res.status(400).json({ error: 'Issue ID is required' });
        }
        
        // Use the FineCalculator class to handle the transaction
        const result = await fineCalculator.returnBook(issue_id);
        
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }
        
        console.log('Book return result:', result);
        
        res.json({
            message: result.message,
            fine: result.fine > 0 ? `Fine of ₹${result.fine.toFixed(2)} applied for ${result.daysOverdue} days overdue` : 'No fine applied'
        });
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(500).json({ error: 'Failed to return book: ' + error.message });
    }
});

// Get fines data (admin)
app.get('/api/admin/fines', async (req, res) => {
    try {
        // Verify admin role
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        
        // Use FineCalculator class to get students with fines
        const finesData = await fineCalculator.getStudentsWithFines();
        
        console.log('Students with fines/issued books:', finesData.students);
        
        res.json(finesData);
    } catch (error) {
        console.error('Error fetching fines data:', error);
        res.status(500).json({ error: 'Failed to fetch fines data' });
    }
});

// Start server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
