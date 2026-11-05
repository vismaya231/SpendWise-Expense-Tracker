
const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// Test API
app.get("/", (req, res) => {
    res.send("SpendWise Backend is Running!");
});

// Get all transactions
app.get("/api/transactions", (req, res) => {
    try {
        const transactions = db.prepare(
            "SELECT * FROM transactions ORDER BY date DESC, id DESC"
        ).all();

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

// Add a transaction
app.post("/api/transactions", (req, res) => {
    try {
        const { title, type, category, amount, date } = req.body;

        // Server-side validation
        if (!title || !title.trim() ||
            !category || !category.trim() ||
            !type || !date) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({
                error: "Invalid transaction type"
            });
        }

        if (typeof amount !== "number" ||
            !Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                error: "Amount must be a valid positive number"
            });
        }

        // Validate date independently on server
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !Number.isFinite(Date.parse(date)) ||
            new Date(date + "T00:00:00.000Z")
                .toISOString().slice(0, 10) !== date) {
            return res.status(400).json({
                error: "Invalid date"
            });
        }

        const result = db.prepare(`
            INSERT INTO transactions
            (title, type, category, amount, date)
            VALUES (?, ?, ?, ?, ?)
        `).run(title.trim(), type, category.trim(), amount, date);

        const transaction = db.prepare(
            "SELECT * FROM transactions WHERE id = ?"
        ).get(result.lastInsertRowid);

        res.status(201).json(transaction);

    } catch (error) {
        res.status(500).json({
            error: "Failed to add transaction"
        });
    }
});

// Delete a transaction
app.delete("/api/transactions/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid transaction ID"
            });
        }

        const result = db.prepare(
            "DELETE FROM transactions WHERE id = ?"
        ).run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Transaction not found"
            });
        }

        res.json({
            message: "Transaction deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            error: "Failed to delete transaction"
        });
    }
});

// Dashboard summary
app.get("/api/summary", (req, res) => {
    try {
        const summary = db.prepare(`
            SELECT
                COALESCE(SUM(CASE
                    WHEN type = 'income' THEN amount
                    ELSE 0
                END), 0) AS totalIncome,

                COALESCE(SUM(CASE
                    WHEN type = 'expense' THEN amount
                    ELSE 0
                END), 0) AS totalExpenses

            FROM transactions
        `).get();

        const netSavings =
            summary.totalIncome - summary.totalExpenses;

        res.json({
            totalIncome: summary.totalIncome,
            totalExpenses: summary.totalExpenses,
            netSavings
        });

    } catch (error) {
        res.status(500).json({
            error: "Failed to calculate summary"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`SpendWise server running at http://localhost:${PORT}`);
});
