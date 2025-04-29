/**
 * ProfileManager Class
 * Handles the user profile display and management in the frontend
 */
class ProfileManager {
    /**
     * Initialize ProfileManager
     * @param {Object} selectors - DOM element selectors for profile information
     */
    constructor(selectors) {
        this.selectors = selectors || {
            username: '#profileUsername',
            name: '#profileName',
            email: '#profileEmail',
            createdAt: '#profileCreatedAt',
            issuedCount: '#issuedCount',
            totalFines: '#totalFines',
            welcomeName: '#studentName'
        };
        this.profileData = null;
    }

    /**
     * Fetch the user profile data from the server
     * @returns {Promise<Object>} - User profile data
     */
    async fetchProfileData() {
        try {
            const response = await fetch('/api/student/profile');
            if (!response.ok) {
                throw new Error(`Failed to fetch profile: ${response.status}`);
            }
            
            this.profileData = await response.json();
            return this.profileData;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    }

    /**
     * Update profile display with fetched data
     */
    updateDisplay() {
        if (!this.profileData) {
            console.error('No profile data available');
            return;
        }
        
        // Update welcome name
        if (this.selectors.welcomeName) {
            const welcomeEl = document.querySelector(this.selectors.welcomeName);
            if (welcomeEl) welcomeEl.textContent = this.profileData.name || 'Student';
        }
        
        // Update username
        if (this.selectors.username) {
            const usernameEl = document.querySelector(this.selectors.username);
            if (usernameEl) usernameEl.textContent = this.profileData.username || 'N/A';
        }
        
        // Update name
        if (this.selectors.name) {
            const nameEl = document.querySelector(this.selectors.name);
            if (nameEl) nameEl.textContent = this.profileData.name || 'N/A';
        }
        
        // Update email
        if (this.selectors.email) {
            const emailEl = document.querySelector(this.selectors.email);
            if (emailEl) emailEl.textContent = this.profileData.email || 'N/A';
        }
        
        // Update creation date
        if (this.selectors.createdAt) {
            const createdAtEl = document.querySelector(this.selectors.createdAt);
            if (createdAtEl) {
                if (this.profileData.created_at) {
                    const date = new Date(this.profileData.created_at);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    createdAtEl.textContent = date.toLocaleDateString('en-US', options);
                } else {
                    createdAtEl.textContent = 'N/A';
                }
            }
        }
        
        // Update issued books count
        if (this.selectors.issuedCount) {
            const issuedCountEl = document.querySelector(this.selectors.issuedCount);
            if (issuedCountEl) {
                issuedCountEl.textContent = `${this.profileData.issued_books_count || 0} books`;
            }
        }
        
        // Update total fines
        if (this.selectors.totalFines) {
            const totalFinesEl = document.querySelector(this.selectors.totalFines);
            if (totalFinesEl) {
                totalFinesEl.textContent = (this.profileData.total_fines || 0).toFixed(2);
            }
        }
    }

    /**
     * Initialize the profile manager - fetch data and update display
     * @returns {Promise<void>}
     */
    async init() {
        try {
            await this.fetchProfileData();
            this.updateDisplay();
        } catch (error) {
            console.error('Failed to initialize profile:', error);
            
            // Check if it's an authentication error
            if (error.message.includes('401') || error.message.includes('403')) {
                window.location.href = '/login.html';
            }
        }
    }
}

// Export for ES modules or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileManager;
} else {
    window.ProfileManager = ProfileManager;
}
