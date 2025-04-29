/**
 * Index file for all classes
 * This file exports all the class instances for use in the application
 */
const DatabaseManager = require('./DatabaseManager');
const UserManager = require('./UserManager');
const BookManager = require('./BookManager');
const FineCalculator = require('./FineCalculator');

// Create instances
const dbManager = new DatabaseManager();
const userManager = new UserManager(dbManager);
const bookManager = new BookManager(dbManager);
const fineCalculator = new FineCalculator(dbManager);

module.exports = {
    dbManager,
    userManager,
    bookManager,
    fineCalculator
};
