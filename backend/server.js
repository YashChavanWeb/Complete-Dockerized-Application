const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection setup
const db = mysql.createConnection({
    host: "localhost", // or "mysql" when using Docker Compose
    user: "root",
    password: "rootpassword",
    database: "accountsdb",
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Connected to MySQL database!");
    }
});

// --------------------- ROUTES ----------------------

// 🟢 Add Money
app.post("/add-money", (req, res) => {
    const { accountId, amount } = req.body;

    if (!accountId || !amount) {
        return res
            .status(400)
            .json({ success: false, message: "Missing accountId or amount" });
    }

    // Update balance
    const updateQuery = `UPDATE accounts SET balance = balance + ? WHERE account_id = ?`;
    db.query(updateQuery, [amount, accountId], (err, result) => {
        if (err) {
            console.error("❌ Error updating balance:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Account not found" });
        }

        // Insert into transactions
        const insertTransaction =
            "INSERT INTO transactions (account_id, type, amount) VALUES (?, 'deposit', ?)";
        db.query(insertTransaction, [accountId, amount], (err2) => {
            if (err2) {
                console.error("❌ Error inserting transaction:", err2);
            }
        });

        // Fetch updated balance to show to user
        const balanceQuery = "SELECT balance FROM accounts WHERE account_id = ?";
        db.query(balanceQuery, [accountId], (err3, results) => {
            if (err3 || results.length === 0)
                return res.json({
                    success: true,
                    message: `Added ₹${amount} successfully.`,
                });

            res.json({
                success: true,
                message: `Added ₹${amount} to account ${accountId}. New balance: ₹${results[0].balance}`,
            });
        });
    });
});

// 🔴 Withdraw Money
app.post("/withdraw-money", (req, res) => {
    const { accountId, amount } = req.body;

    if (!accountId || !amount) {
        return res
            .status(400)
            .json({ success: false, message: "Missing accountId or amount" });
    }

    // Check balance first
    const checkBalanceQuery = "SELECT balance FROM accounts WHERE account_id = ?";
    db.query(checkBalanceQuery, [accountId], (err, results) => {
        if (err) {
            console.error("❌ Error fetching balance:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Account not found" });
        }

        const currentBalance = parseFloat(results[0].balance);
        if (currentBalance < amount) {
            return res
                .status(400)
                .json({ success: false, message: "Insufficient funds" });
        }

        // Deduct balance
        const withdrawQuery = `UPDATE accounts SET balance = balance - ? WHERE account_id = ?`;
        db.query(withdrawQuery, [amount, accountId], (err2, result) => {
            if (err2) {
                console.error("❌ Error updating balance:", err2);
                return res.status(500).json({ success: false, message: "Database error" });
            }

            // Insert into transactions
            const insertTransaction =
                "INSERT INTO transactions (account_id, type, amount) VALUES (?, 'withdraw', ?)";
            db.query(insertTransaction, [accountId, amount], (err3) => {
                if (err3) {
                    console.error("❌ Error inserting transaction:", err3);
                }
            });

            // Fetch updated balance
            const balanceQuery = "SELECT balance FROM accounts WHERE account_id = ?";
            db.query(balanceQuery, [accountId], (err4, results2) => {
                if (err4 || results2.length === 0)
                    return res.json({
                        success: true,
                        message: `Withdrew ₹${amount} successfully.`,
                    });

                res.json({
                    success: true,
                    message: `Withdrew ₹${amount} from account ${accountId}. New balance: ₹${results2[0].balance}`,
                });
            });
        });
    });
});

// 🧾 Get All Accounts
app.get("/accounts", (req, res) => {
    db.query("SELECT * FROM accounts", (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 🧾 Get Transaction History (optional)
app.get("/transactions", (req, res) => {
    db.query(
        "SELECT * FROM transactions ORDER BY created_at DESC",
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// Test route
app.get("/", (req, res) => {
    res.send("Backend API is running 🚀");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
