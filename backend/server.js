const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Dummy in-memory accounts for now
let accounts = {
    1: { balance: 1000 },
    2: { balance: 500 },
};

// Add Money Endpoint
app.post("/add-money", (req, res) => {
    const { accountId, amount } = req.body;
    if (!accountId || !amount) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    if (!accounts[accountId]) {
        // If account doesn't exist, create it
        accounts[accountId] = { balance: 0 };
    }

    accounts[accountId].balance += Number(amount);
    console.log(`Account ${accountId} new balance: ${accounts[accountId].balance}`);

    res.json({
        success: true,
        message: `Added ₹${amount} to account ${accountId}. New balance: ₹${accounts[accountId].balance}`,
    });
});

// Withdraw Money Endpoint
app.post("/withdraw-money", (req, res) => {
    const { accountId, amount } = req.body;
    if (!accountId || !amount) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const account = accounts[accountId];
    if (!account) {
        return res.status(404).json({ success: false, message: "Account not found" });
    }

    if (account.balance < amount) {
        return res.status(400).json({ success: false, message: "Insufficient funds" });
    }

    account.balance -= Number(amount);
    console.log(`Account ${accountId} new balance: ${account.balance}`);

    res.json({
        success: true,
        message: `Withdrew ₹${amount} from account ${accountId}. New balance: ₹${account.balance}`,
    });
});

// Just for quick testing
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
