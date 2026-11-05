
const Database = require("better-sqlite3");
const path = require("path");

// Create or connect to SQLite database
const db = new Database(path.join(__dirname, "transactions.db"));

// Create transactions table
db.prepare(`
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        category TEXT NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`).run();

console.log("SQLite database connected successfully!");

// Export database connection
module.exports = db;
