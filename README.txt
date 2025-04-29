# Library Management System

## Overview
This is a Node.js-based Library Management System converted from a Flask application. It allows students to browse, issue, and return books, while administrators can manage books, track issued books, and monitor fines.

## Features
- User authentication (student and admin)
- Student dashboard for viewing and issuing books
- Admin dashboard for managing books, students, and fines
- Book issuing and returning with fine calculation
- Responsive UI using Bootstrap

## Database Schema
The system uses MySQL with the following tables:

### books
- book_id (PK, auto_increment)
- isbn (unique)
- title
- author
- quantity
- available_quantity
- created_at

### students
- student_id (PK, auto_increment)
- username (unique)
- password (hashed)
- name
- email (unique)
- created_at

### issued_books
- issue_id (PK, auto_increment)
- student_id (FK)
- book_id (FK)
- issue_date
- return_date
- fine_amount
- status ('issued' or 'returned')

## Installation and Setup
1. Ensure Node.js and MySQL are installed on your system
2. Clone the repository
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file with the following variables:
   ```
   DB_HOST=sql12.freesqldatabase.com
   DB_USER=sql12775878
   DB_PASSWORD=r33tT2EF5Y
   DB_NAME=sql12775878
   DB_PORT=3306
   SESSION_SECRET=your_session_secret
   NODE_ENV=development
   ```
5. Start the server:
   ```
   node server.js
   ```
6. Access the application at http://localhost:3002

## Usage
### Admin Access
- Username: admin
- Password: admin
- Features: Add/edit books, view issued books, manage fines

### Student Access
- Register a new account or use existing credentials
- Features: View available books, issue books, return books, view fines

## Fine Calculation
- Fines are calculated at ₹5 per day after a 7-day grace period
- Fines are automatically calculated when books are returned
- Pending fines for overdue books are displayed in the dashboard

## API Endpoints
- `/api/student/profile` — Student/admin profile info
- `/api/books` — Get available books
- `/api/admin/books` — Get all books (admin)
- `/api/admin/books/:id` — Get book details (admin)
- `/api/admin/books/add` — Add new book (admin)
- `/api/admin/books/edit` — Edit book (admin)
- `/api/issue-book` — Issue a book to current student
- `/api/return-book` — Return a book (student)
- `/api/student/issued-books` — Get books issued to current student
- `/api/admin/issued-books` — Get all issued books (admin)
- `/api/admin/books/return` — Return a book (admin)
- `/api/admin/fines` — Get fines and pending books (admin)

## Security Features
- Passwords are hashed using bcrypt
- Session cookies are HTTP-only and secure in production
- All admin endpoints require admin session role
- SQL queries use parameterized statements to prevent SQL injection

## Troubleshooting
- If you encounter database connection issues, check your .env file and database credentials
- For session-related issues, try clearing your browser cookies
- If book issuing/returning fails, check the server logs for detailed error messages

## Object-Oriented Programming Concepts Used

The application has been fully refactored to implement object-oriented programming principles using a class-based architecture.

### Class-Based Architecture
- Backend classes: DatabaseManager, UserManager, BookManager, FineCalculator
- Frontend classes: SessionHandler, BookManager, AdminManager, ProfileManager
- Each class represents a specific domain of functionality
- All related methods and state are contained within appropriate classes

### Encapsulation
- Each class encapsulates its own data and exposes only necessary methods
- Database operations are encapsulated in the DatabaseManager class
- User operations are encapsulated in the UserManager class
- Book operations are encapsulated in the BookManager class
- Fine calculations are encapsulated in the FineCalculator class
- Frontend operations are encapsulated in their respective manager classes

### Abstraction
- Complex operations are abstracted behind simple method interfaces:
  - DatabaseManager abstracts database connection and query execution
  - BookManager abstracts book issuing, returning, and querying
  - FineCalculator abstracts fine calculation algorithms
  - ProfileManager abstracts profile data handling and display
- Users of these classes don't need to understand the implementation details

### Inheritance (Conceptual)
- Classes follow conceptual inheritance patterns with clearly defined responsibilities
- While direct class inheritance isn't heavily used, the design allows for future extension
- Frontend classes could extend base classes for common behavior if needed

### Polymorphism
- Methods like returnBook() are implemented in both backend and frontend classes
- Each class provides its own implementation appropriate to its context
- The BookManager.getBookById() and BookManager.getAllBooks() methods show polymorphic behavior
- The ProfileManager.updateDisplay() method handles various types of profile data

### Modularity
- Code is organized into multiple class files in the /classes and /public/js directories
- Each class is in its own file for better maintainability
- Clear separation between backend and frontend classes
- Server routes call appropriate class methods rather than implementing logic directly

### Single Responsibility Principle
- Each class has a single, well-defined responsibility
- DatabaseManager only handles database operations
- UserManager only handles user authentication and profiles
- BookManager only handles book-related operations
- FineCalculator only handles fine calculations
- Frontend classes handle only their specific UI operations

### Code Examples

#### Backend Class Usage
```javascript
// Create instances of backend classes
const dbManager = new DatabaseManager();
const userManager = new UserManager(dbManager);
const bookManager = new BookManager(dbManager);
const fineCalculator = new FineCalculator(dbManager);

// Using classes in API endpoints
app.post('/register', async (req, res) => {
    const result = await userManager.registerStudent(username, password, name, email);
    // Handle result
});
```

#### Frontend Class Usage
```javascript
// Create instances of frontend classes
const sessionHandler = new SessionHandler();
const bookManager = new BookManager();
const profileManager = new ProfileManager();

// Using classes in the UI
sessionHandler.checkLogin('/login.html')
    .then(() => {
        profileManager.init();
        bookManager.loadAvailableBooks();
    });
```

### Benefits of OOP Refactoring
- **Improved Maintainability**: Each class has a specific responsibility
- **Enhanced Readability**: Code organization clearly shows system structure
- **Better Testing**: Classes can be tested in isolation
- **Easier Debugging**: Issues can be isolated to specific classes
- **Improved Scalability**: New features can be added by extending existing classes
- **Better Learning**: Code structure clearly demonstrates OOP principles
- **Reduced Duplication**: Common functionality is centralized in appropriate classes

## Credits
This application was converted from a Flask-based Library Management System to Node.js/Express while maintaining the same functionality and database schema.
