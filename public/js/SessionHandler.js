/**
 * SessionHandler Class
 * Manages user sessions in the frontend
 */
class SessionHandler {
    /**
     * Initialize SessionHandler
     */
    constructor() {
        this.user = null;
    }

    /**
     * Check if the user is logged in and redirect if not
     * @param {string} redirectTo - URL to redirect to if not logged in
     * @returns {Promise<Object>} - User profile data if logged in
     */
    async checkLogin(redirectTo = '/login.html') {
        try {
            const response = await fetch('/api/student/profile');
            
            if (!response.ok) {
                console.error('Profile fetch error:', response.status, response.statusText);
                if (response.status === 401 || response.status === 403) {
                    window.location.href = redirectTo;
                }
                throw new Error('Failed to fetch profile');
            }
            
            this.user = await response.json();
            return this.user;
        } catch (error) {
            console.error('Error checking login status:', error);
            throw error;
        }
    }

    /**
     * Log the user out
     */
    logout() {
        window.location.href = '/logout';
    }

    /**
     * Get the user's profile data
     * @returns {Object|null} - User profile data
     */
    getUserData() {
        return this.user;
    }

    /**
     * Update HTML elements with user profile data
     * @param {Object} selectors - HTML element selectors to update
     */
    updateProfileDisplay(selectors) {
        if (!this.user) return;
        
        // Update welcome name
        if (selectors.name && this.user.name) {
            document.querySelector(selectors.name).textContent = this.user.name;
        }
        
        // Update username
        if (selectors.username && this.user.username) {
            document.querySelector(selectors.username).textContent = this.user.username;
        }
        
        // Update email
        if (selectors.email && this.user.email) {
            document.querySelector(selectors.email).textContent = this.user.email;
        }
        
        // Update created_at date
        if (selectors.createdAt && this.user.created_at) {
            const date = new Date(this.user.created_at);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            document.querySelector(selectors.createdAt).textContent = date.toLocaleDateString('en-US', options);
        }
        
        // Update issued books count
        if (selectors.issuedCount && this.user.issued_books_count !== undefined) {
            document.querySelector(selectors.issuedCount).textContent = `${this.user.issued_books_count} books`;
        }
        
        // Update total fines
        if (selectors.totalFines && this.user.total_fines !== undefined) {
            document.querySelector(selectors.totalFines).textContent = (this.user.total_fines).toFixed(2);
        }
    }
}

// Export for ES modules or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionHandler;
} else {
    window.SessionHandler = SessionHandler;
}
