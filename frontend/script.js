document.addEventListener("DOMContentLoaded", () => {
    // IMPORTANT: The backend URL must match your Express server setup
    const backendBaseUrl = "http://localhost:5000";

    // DOM Elements
    const addForm = document.getElementById("addForm");
    const withdrawForm = document.getElementById("withdrawForm");
    const responseDiv = document.getElementById("response");
    const menuToggle = document.getElementById("menuToggle");
    const navLinksList = document.querySelector(".nav-links");
    const navLinks = navLinksList.querySelectorAll(".nav-link");
    const allViews = document.querySelectorAll(".view-section");
    const homeLink = document.getElementById("homeLink");
    const historyContentDiv = document.getElementById("history-content");

    const defaultViewId = 'welcome-section';


    // --- Helper Function for UX Feedback ---
    function showResponse(message, status) {
        // Status: 'success', 'error', 'loading'
        responseDiv.textContent = message;
        responseDiv.style.display = 'block';

        switch (status) {
            case 'success':
                responseDiv.style.backgroundColor = '#d4edda'; // Light green
                responseDiv.style.color = '#155724';
                break;
            case 'error':
                responseDiv.style.backgroundColor = '#f8d7da'; // Light red
                responseDiv.style.color = '#721c24';
                break;
            case 'loading':
                responseDiv.style.backgroundColor = '#fff3cd'; // Light yellow
                responseDiv.style.color = '#856404';
                break;
            default:
                responseDiv.style.backgroundColor = 'white';
                responseDiv.style.color = '#007bff';
        }
    }

    // --- History Fetch and Render Function ---
    async function fetchAndRenderHistory() {
        historyContentDiv.innerHTML = '<p>⏳ Loading transactions...</p>';
        try {
            const res = await fetch(`${backendBaseUrl}/transactions`);
            const transactions = await res.json();

            if (res.ok && transactions.length > 0) {
                let tableHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Account</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                transactions.forEach(tx => {
                    const date = new Date(tx.created_at).toLocaleString();
                    const typeClass = tx.type; // 'deposit' or 'withdraw'

                    tableHTML += `
                        <tr>
                            <td data-label="ID">${tx.transaction_id}</td>
                            <td data-label="Account">${tx.account_id}</td>
                            <td data-label="Type" class="${typeClass}">${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</td>
                            <td data-label="Amount" class="${typeClass}">₹${parseFloat(tx.amount).toFixed(2)}</td>
                            <td data-label="Date">${date}</td>
                        </tr>
                    `;
                });
                tableHTML += `</tbody></table>`;
                historyContentDiv.innerHTML = tableHTML;
            } else if (res.ok && transactions.length === 0) {
                historyContentDiv.innerHTML = '<p>No transactions found for this bank.</p>';
            } else {
                historyContentDiv.innerHTML = `<p style="color: var(--danger-color);">Error fetching history: ${transactions.error || 'Server error'}</p>`;
            }
        } catch (error) {
            historyContentDiv.innerHTML = `<p style="color: var(--danger-color);">❌ Network Error: Could not connect to the backend API.</p>`;
        }
    }


    // --- Core View Toggling Logic ---
    function setActiveView(targetId) {
        // 1. Update Navigation Links (Active State)
        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${targetId}`) {
                link.classList.add("active");
            }
        });

        // 2. Update View Visibility
        allViews.forEach(view => {
            view.classList.remove("active-view");
            if (view.id === targetId) {
                view.classList.add("active-view");
            }
        });

        // 3. SPECIAL CASE: Load history if the history view is activated
        if (targetId === 'history-section') {
            fetchAndRenderHistory();
        }

        // 4. Clear previous response message
        responseDiv.style.display = 'none';
    }

    // --- Initialization and Routing Setup ---
    const initialHash = window.location.hash.substring(1);
    setActiveView(initialHash || defaultViewId);


    // Listener for Navigation Clicks (including home link)
    [...navLinks, homeLink].forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetHref = e.target.getAttribute("href");

            if (targetHref && targetHref.startsWith('#')) {
                const targetId = targetHref.substring(1);
                setActiveView(targetId);

                // Update URL hash without causing a page jump
                history.pushState(null, null, targetHref);
            }

            // Close the mobile menu after clicking a link
            navLinksList.classList.remove("active");
        });
    });

    // Handle back/forward button navigation (using URL hash)
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.substring(1);
        setActiveView(newHash || defaultViewId);
    });

    // Listener for Responsive Navbar Toggle (Hamburger icon)
    menuToggle.addEventListener("click", () => {
        navLinksList.classList.toggle("active");
    });

    // --- Deposit Form Handler ---
    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const accountId = document.getElementById("addAccountId").value;
        const amount = document.getElementById("addAmount").value;

        showResponse('⏳ Processing deposit...', 'loading');

        try {
            const res = await fetch(`${backendBaseUrl}/add-money`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Backend expects amount as a number, so we parse it here
                body: JSON.stringify({ accountId, amount: parseFloat(amount) }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showResponse(`✅ ${data.message}`, 'success');
                addForm.reset();
            } else {
                // The backend uses status 404/400/500 for errors, so we handle it here
                showResponse(`❌ Deposit failed: ${data.message || 'Server error'}`, 'error');
            }
        } catch (error) {
            showResponse(`❌ Network or Fetch Error: Could not connect to the backend.`, 'error');
        }
    });

    // --- Withdraw Form Handler ---
    withdrawForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const accountId = document.getElementById("withdrawAccountId").value;
        const amount = document.getElementById("withdrawAmount").value;

        showResponse('⏳ Processing withdrawal...', 'loading');

        try {
            const res = await fetch(`${backendBaseUrl}/withdraw-money`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Backend expects amount as a number, so we parse it here
                body: JSON.stringify({ accountId, amount: parseFloat(amount) }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showResponse(`✅ ${data.message}`, 'success');
                withdrawForm.reset();
            } else {
                // The backend uses status 400/404/500 for errors, so we handle it here
                showResponse(`❌ Withdrawal failed: ${data.message || 'Server error'}`, 'error');
            }
        } catch (error) {
            showResponse(`❌ Network or Fetch Error: Could not connect to the backend.`, 'error');
        }
    });
});