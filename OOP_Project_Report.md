# Library Management System
## Object-Oriented Programming Project Report

---

# Title Page

## Project Name: Library Management System

## Team Members:
- [Your Name]
- [Team Member Name]
- [Team Member Name]

## Submission Date: 29th April, 2023

---

# Abstract

This project implements a comprehensive Library Management System using Node.js, Express, and MySQL. The system facilitates book management, user authentication, and transaction tracking through a well-structured object-oriented architecture. Key features include user authentication (student and admin roles), book issuing and returning functionality, fine calculation, and responsive UI design. The primary objective of this project is to demonstrate the practical application of Object-Oriented Programming principles in developing a real-world web application while providing an efficient solution for library resource management.

---

# Introduction

## Project Overview

The Library Management System is a web-based application converted from a Flask application to Node.js while maintaining the same core functionality. It serves as a digital platform for libraries to manage their book inventory, track student borrowing activity, and automate fine calculations. The system provides separate dashboards for students and administrators, with students able to browse available books, issue and return books, and view their fines, while administrators can manage books, monitor issued books, and track fines across all users.

## OOP Concepts Used

The project extensively implements core OOP principles to create a maintainable, scalable, and robust application:

### 1. Class-Based Architecture

The application is structured around classes, with clear separation between backend and frontend components:

- **Backend Classes**: DatabaseManager, UserManager, BookManager, FineCalculator
- **Frontend Classes**: SessionHandler, BookManager, AdminManager, ProfileManager

Each class represents a specific domain of functionality with well-defined responsibilities.

### 2. Encapsulation

Encapsulation is implemented by bundling data and methods within classes and exposing only necessary interfaces:

- **DatabaseManager**: Encapsulates database connection and query execution
- **UserManager**: Encapsulates user authentication and profile management
- **BookManager**: Encapsulates book-related operations
- **FineCalculator**: Encapsulates fine calculation algorithms

This approach hides implementation details and provides a clean API for other components.

### 3. Abstraction

The system implements abstraction by hiding complex operations behind simple interfaces:

- Complex database operations are abstracted in the DatabaseManager class
- User authentication flows are abstracted in the UserManager class
- Book issuing and returning logic is abstracted in the BookManager class

This allows other parts of the application to use these services without understanding the implementation details.

### 4. Inheritance

While direct class inheritance isn't heavily used, the design allows for conceptual inheritance patterns:

- Classes follow a hierarchical organization with clearly defined responsibilities
- The architecture is designed to support extension through inheritance if needed

### 5. Polymorphism

The application demonstrates polymorphism through methods that can handle different types of data or provide different implementations based on context:

- Methods like `returnBook()` are implemented in both backend and frontend classes
- The BookManager class provides polymorphic behavior through methods like `getBookById()` and `getAllBooks()`
- The ProfileManager handles various types of profile data display

---

# Implementation

## Development Environment and Tools

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Database**: MySQL
- **Version Control**: Git
- **Development Tools**: VS Code, Node Package Manager (npm)
- **Testing**: Manual testing

## Code Implementation

### Backend Classes Implementation

#### 1. DatabaseManager Class

The DatabaseManager class encapsulates all database operations, providing a clean interface for other classes to interact with the database.

```javascript
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
}
```

#### 2. UserManager Class

The UserManager class handles user authentication, registration, and profile management, demonstrating encapsulation of user-related operations.

```javascript
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
}
```

### Frontend Classes Implementation

#### AdminManager Class

The AdminManager class handles admin-specific operations in the frontend, demonstrating encapsulation and abstraction of admin functionality.

```javascript
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
            }
            
            return books;
        } catch (error) {
            console.error('Error loading books:', error);
            return [];
        }
    }
}
```

## Server Implementation with OOP Integration

The server.js file shows how the OOP classes are instantiated and used in the Express.js routes:

```javascript
// Import our OOP classes
const { dbManager, userManager, bookManager, fineCalculator } = require('./classes');

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
```

## Application Screenshots

[Note: Insert screenshots of your application here, showing:
1. Login/Registration screen
2. Student dashboard
3. Admin dashboard
4. Book management interface
5. Any error messages or confirmation dialogs]

---

# Conclusion

## Achievements

The Library Management System project successfully demonstrates the application of Object-Oriented Programming principles in developing a real-world web application. Key achievements include:

1. Created a well-structured, maintainable codebase using OOP principles
2. Implemented a complete library management solution with student and admin functionality
3. Developed a secure authentication system with role-based access control
4. Created an intuitive and responsive user interface
5. Implemented automated fine calculation for overdue books

## Challenges and Solutions

During development, several challenges were encountered and resolved:

1. **Database Connection Management**: Initially, creating new database connections for each request caused performance issues. This was resolved by implementing a connection pool in the DatabaseManager class.

2. **Session Management**: Session persistence issues required configuration adjustments and the implementation of proper error handling in the authentication flow.

3. **Fine Calculation Logic**: Calculating fines required careful handling of date comparisons. This was solved by encapsulating the logic in the FineCalculator class with well-defined methods.

4. **Asynchronous Operations**: Managing asynchronous database operations required proper implementation of async/await patterns and error handling throughout the codebase.

## Future Improvements

Several enhancements could further improve the Library Management System:

1. **Unit Testing**: Implement comprehensive unit tests for all classes to ensure reliability and facilitate future development.

2. **Pagination**: Add pagination for books and issued books listings to improve performance with large datasets.

3. **Advanced Search**: Implement advanced search functionality to find books by various criteria.

4. **Email Notifications**: Add email notifications for overdue books and registration confirmation.

5. **Mobile Application**: Develop a mobile application that interfaces with the API.

6. **Analytics Dashboard**: Implement an analytics dashboard for administrators to track library usage patterns.

---

# References

1. Node.js Documentation: https://nodejs.org/en/docs/
2. Express.js Documentation: https://expressjs.com/
3. MySQL Documentation: https://dev.mysql.com/doc/
4. Bootstrap Documentation: https://getbootstrap.com/docs/
5. "Clean Code: A Handbook of Agile Software Craftsmanship" by Robert C. Martin
6. "Object-Oriented Analysis and Design with Applications" by Grady Booch
7. MDN Web Docs: https://developer.mozilla.org/
8. JavaScript.info: https://javascript.info/
