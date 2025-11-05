document.addEventListener("DOMContentLoaded", () => {
    const backendBaseUrl = "http://localhost:5000";

    // DOM Elements
    const addForm = document.getElementById("addForm");
    const withdrawForm = document.getElementById("withdrawForm");
    const responseDiv = document.getElementById("response");
    const menuToggle = document.getElementById("menuToggle");
    const navLinksList = document.querySelector(".nav-links");
    const navLinks = navLinksList.querySelectorAll(".nav-link");
    const allViews = document.querySelectorAll(".view-section");
    const homeLink = document.getElementById("homeLink"); // New: For Logo/Home click

    // --- Core View Toggling Logic ---
    function setActiveView(targetId) {
        // 1. Update Navigation Links (Active State)
        navLinks.forEach(link => {
            link.classList.remove("active");
            // Check the href attribute against the targetId
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

        // 3. Clear previous response message
        responseDiv.style.display = 'none';
    }

    // --- Initialize the View based on URL Hash or default to Welcome ---
    const initialHash = window.location.hash.substring(1); // Get hash without '#'
    const defaultViewId = 'welcome-section';

    // If a valid view is in the URL hash, use it; otherwise, use the default.
    setActiveView(initialHash || defaultViewId);


    // --- Event Listeners ---

    // Listener for Navigation Clicks (including home link)
    [...navLinks, homeLink].forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetHref = e.target.getAttribute("href");

            // Only proceed if targetHref is a hash link
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

    // --- Helper Function for UX Feedback (Remains the same) ---
    function showResponse(message, status) {
        // ... (showResponse function logic remains the same) ...
        responseDiv.textContent = message;
        responseDiv.style.display = 'block';

        switch (status) {
            case 'success':
                responseDiv.style.backgroundColor = '#d4edda';
                responseDiv.style.color = '#155724';
                break;
            case 'error':
                responseDiv.style.backgroundColor = '#f8d7da';
                responseDiv.style.color = '#721c24';
                break;
            case 'loading':
                responseDiv.style.backgroundColor = '#fff3cd';
                responseDiv.style.color = '#856404';
                break;
            default:
                responseDiv.style.backgroundColor = 'white';
                responseDiv.style.color = '#007bff';
        }
    }

    // --- Form Handlers (Remains the same, ensures amount is parsed) ---
    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const accountId = document.getElementById("addAccountId").value;
        const amount = document.getElementById("addAmount").value;
        showResponse('⏳ Processing deposit...', 'loading');
        // ... (fetch logic) ...
        try {
            const res = await fetch(`${backendBaseUrl}/add-money`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId, amount: parseFloat(amount) }),
            });
            const data = await res.json();
            if (res.ok) {
                showResponse(`✅ Deposit successful: ${data.message}`, 'success');
                addForm.reset();
            } else {
                showResponse(`❌ Deposit failed: ${data.message || 'Server error'}`, 'error');
            }
        } catch (error) {
            showResponse(`❌ Network or Fetch Error: Could not connect to the backend.`, 'error');
        }
    });

    withdrawForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const accountId = document.getElementById("withdrawAccountId").value;
        const amount = document.getElementById("withdrawAmount").value;
        showResponse('⏳ Processing withdrawal...', 'loading');
        // ... (fetch logic) ...
        try {
            const res = await fetch(`${backendBaseUrl}/withdraw-money`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId, amount: parseFloat(amount) }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showResponse(`✅ Withdrawal successful: ${data.message}`, 'success');
                withdrawForm.reset();
            } else {
                showResponse(`❌ Withdrawal failed: ${data.message || 'Server error'}`, 'error');
            }
        } catch (error) {
            showResponse(`❌ Network or Fetch Error: Could not connect to the backend.`, 'error');
        }
    });
});