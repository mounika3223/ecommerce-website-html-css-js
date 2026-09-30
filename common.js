/**
 * Qmart E-Commerce - Shared Core Utilities (common.js)
 */

// Initialize shared elements when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initCommon();
    updateCartBadge();
    updateWishlistBadge();
    checkUserSession();
    initCustomerServiceChat();
    initBottomMobileNav();
});

// Cross-tab storage synchronization
window.addEventListener("storage", (e) => {
    if (e.key === "cart") updateCartBadge();
    if (e.key === "wishlist") updateWishlistBadge();
    if (e.key === "qmart_user") checkUserSession();
});

// Update Cart Badge across all pages
function updateCartBadge() {
    try {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
        
        document.querySelectorAll(".cart-badge, #cartCount").forEach(badge => {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? "inline-flex" : "none";
        });
    } catch (err) {
        console.error("Error updating cart badge:", err);
    }
}

// Update Wishlist Badge
function updateWishlistBadge() {
    try {
        const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        document.querySelectorAll("#wishlistCount").forEach(badge => {
            badge.textContent = wishlist.length;
            badge.style.display = wishlist.length > 0 ? "inline-block" : "none";
        });
    } catch (err) {
        console.error("Error updating wishlist badge:", err);
    }
}

// Toast Notification
function showToast(title, message, imageUrl = "") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";

    const imgMarkup = imageUrl 
        ? `<img src="${imageUrl}" alt="${title}" class="toast-img" onerror="this.style.display='none'">` 
        : `<div class="toast-img" style="display:flex;align-items:center;justify-content:center;color:#2563eb;font-size:20px;"><i class="fa-solid fa-circle-check"></i></div>`;

    toast.innerHTML = `
        ${imgMarkup}
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
        <div class="toast-close"><i class="fa-solid fa-xmark"></i></div>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
        removeToast(toast);
    });

    container.appendChild(toast);

    setTimeout(() => {
        removeToast(toast);
    }, 3800);
}

function removeToast(toast) {
    if (!toast || toast.classList.contains("hiding")) return;
    toast.classList.add("hiding");
    setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 280);
}

// Global Add to Cart
function addToCartGlobal(product, qty = 1, showFeedback = true) {
    try {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingIdx = cart.findIndex(item => item.id == product.id);

        if (existingIdx > -1) {
            cart[existingIdx].quantity = (parseInt(cart[existingIdx].quantity) || 1) + qty;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail || (product.images && product.images[0]) || "",
                category: product.category,
                description: product.description,
                brand: product.brand || "General",
                rating: product.rating,
                quantity: qty
            });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartBadge();

        if (showFeedback) {
            showToast(
                "Added to Cart",
                `"${product.title}" (${qty}x) is now in your shopping bag.`,
                product.thumbnail || (product.images && product.images[0])
            );
        }
    } catch (err) {
        console.error("Failed to add to cart:", err);
    }
}

// Global Wishlist Toggle
function toggleWishlistGlobal(productId, productTitle, productImage) {
    try {
        let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        const idx = wishlist.indexOf(productId);
        let added = false;

        if (idx > -1) {
            wishlist.splice(idx, 1);
            showToast("Removed from Wishlist", `"${productTitle}" removed from saved items.`);
        } else {
            wishlist.push(productId);
            added = true;
            showToast("Saved to Wishlist", `"${productTitle}" added to your favorites!`, productImage);
        }

        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        updateWishlistBadge();
        return added;
    } catch (e) {
        console.error(e);
        return false;
    }
}

// Check User Login Session
function checkUserSession() {
    try {
        const user = JSON.parse(localStorage.getItem("qmart_user"));
        const accountLinks = document.querySelectorAll(".user-account-btn");

        accountLinks.forEach(el => {
            if (user && user.name) {
                const firstName = user.name.split(" ")[0];
                el.innerHTML = `
                    <div class="user-avatar">${firstName.charAt(0).toUpperCase()}</div>
                    <span>Hi, ${firstName}</span>
                `;
                el.title = "Logged in as " + user.name + " (Click to logout)";
                el.onclick = (e) => {
                    e.preventDefault();
                    if (confirm(`Logged in as ${user.name} (${user.email || ""}). Do you want to sign out?`)) {
                        localStorage.removeItem("qmart_user");
                        showToast("Signed Out", "You have been logged out successfully.");
                        setTimeout(() => window.location.reload(), 600);
                    }
                };
            }
        });
    } catch (e) {
        console.error(e);
    }
}

// Global Mobile Drawer Toggle
function toggleMobileDrawer() {
    const drawer = document.querySelector(".mobile-drawer");
    if (drawer) {
        const isActive = drawer.classList.toggle("active");
        document.body.style.overflow = isActive ? "hidden" : "";
    }
}
window.toggleMobileDrawer = toggleMobileDrawer;

// Initialize Mobile Drawer and common handlers
function initCommon() {
    // Mobile Drawer Setup
    document.querySelectorAll(".mobile-nav-toggle").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            toggleMobileDrawer();
        });
    });

    document.querySelectorAll(".mobile-drawer-close").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const drawer = document.querySelector(".mobile-drawer");
            if (drawer) {
                drawer.classList.remove("active");
                document.body.style.overflow = "";
            }
        });
    });

    document.querySelectorAll(".mobile-drawer").forEach(drawer => {
        drawer.addEventListener("click", (e) => {
            if (e.target === drawer) {
                drawer.classList.remove("active");
                document.body.style.overflow = "";
            }
        });
    });

    document.querySelectorAll(".mobile-nav-links a").forEach(link => {
        link.addEventListener("click", () => {
            const drawer = document.querySelector(".mobile-drawer");
            if (drawer) {
                drawer.classList.remove("active");
                document.body.style.overflow = "";
            }
        });
    });

    // Newsletter subscribe handlers
    document.querySelectorAll(".newsletter-form").forEach(form => {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const input = form.querySelector("input");
            if (input && input.value) {
                showToast("Welcome to Qmart!", "You're subscribed! Use coupon code QMART20 for 20% off.");
                input.value = "";
            }
        });
    });
}

/* ================= LIVE CUSTOMER SUPPORT CHAT ================= */
function initCustomerServiceChat() {
    if (document.getElementById("qmartChatTrigger")) return;
    
    // Don't render floating trigger on customer service page (user is already on the help hub)
    if (window.location.pathname.includes("customer-service")) return;

    // Detect path depth
    const isSubfolder = window.location.pathname.includes("/home/") ||
                        window.location.pathname.includes("/cart/") ||
                        window.location.pathname.includes("/details/") ||
                        window.location.pathname.includes("/registratuion&login/");
    const basePrefix = isSubfolder ? "../" : "./";

    // 1. Floating trigger button
    const trigger = document.createElement("button");
    trigger.id = "qmartChatTrigger";
    trigger.className = "floating-chat-trigger";
    trigger.setAttribute("aria-label", "Customer Support");
    trigger.innerHTML = `
        <span class="chat-online-dot"></span>
        <i class="fa-solid fa-headset"></i>
        <span>Help & Support</span>
    `;

    // 2. Chat window
    const chatWindow = document.createElement("div");
    chatWindow.id = "qmartChatWindow";
    chatWindow.className = "chat-window";
    chatWindow.innerHTML = `
        <div class="chat-window-header">
            <div class="chat-agent-info">
                <div class="chat-agent-avatar">
                    <i class="fa-solid fa-user-nurse"></i>
                    <span class="avatar-status"></span>
                </div>
                <div class="chat-header-text">
                    <h4>Qmart Live Support</h4>
                    <span>Active Now • Average reply 30s</span>
                </div>
            </div>
            <button class="chat-close-btn" onclick="closeLiveChatWidget()" aria-label="Close Chat">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="chat-body" id="chatMessages">
            <div class="chat-msg bot">
                Hi there! Welcome to Qmart Customer Care. How can we help you today?
            </div>
            <div class="chat-quick-chips">
                <button class="chip-btn" onclick="sendQuickPrompt('Track my package')">📦 Track Order</button>
                <button class="chip-btn" onclick="sendQuickPrompt('What is your return policy?')">🔄 Return Policy</button>
                <button class="chip-btn" onclick="sendQuickPrompt('Do you have discount codes?')">🏷️ Discounts</button>
                <button class="chip-btn" onclick="sendQuickPrompt('How long does shipping take?')">🚚 Shipping Times</button>
            </div>
        </div>

        <form class="chat-footer" onsubmit="handleChatSubmit(event)">
            <input type="text" id="chatInput" placeholder="Ask a question or enter Order ID..." autocomplete="off">
            <button type="submit" aria-label="Send Message"><i class="fa-solid fa-paper-plane"></i></button>
        </form>
    `;

    trigger.addEventListener("click", () => {
        openLiveChatWidget();
    });

    document.body.appendChild(trigger);
    document.body.appendChild(chatWindow);
}

function openLiveChatWidget() {
    const win = document.getElementById("qmartChatWindow");
    if (win) {
        win.classList.add("open");
        const input = document.getElementById("chatInput");
        if (input) setTimeout(() => input.focus(), 200);
    }
}

function closeLiveChatWidget() {
    const win = document.getElementById("qmartChatWindow");
    if (win) win.classList.remove("open");
}

function sendQuickPrompt(promptText) {
    const input = document.getElementById("chatInput");
    if (input) {
        input.value = promptText;
        handleChatSubmit(new Event("submit"));
    }
}

function handleChatSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById("chatInput");
    const container = document.getElementById("chatMessages");
    if (!input || !container) return;

    const userText = input.value.trim();
    if (!userText) return;

    // Append user message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-msg user";
    userMsg.textContent = userText;
    container.appendChild(userMsg);
    input.value = "";
    container.scrollTop = container.scrollHeight;

    // Simulate intelligent bot response
    setTimeout(() => {
        const botMsg = document.createElement("div");
        botMsg.className = "chat-msg bot";

        const lower = userText.toLowerCase();

        if (lower.includes("track") || lower.includes("order") || lower.includes("package") || lower.includes("where")) {
            botMsg.innerHTML = `You can track any shipment directly using our <a href="${getBasePrefix()}customer-service.html#orderTrackingSection" style="color:#2563eb;font-weight:700;text-decoration:underline;">Package Tracking Tool</a>! If you placed an order today, your reference code is formatted like <strong>#QM-84920</strong>.`;
        } else if (lower.includes("return") || lower.includes("refund") || lower.includes("exchange")) {
            botMsg.innerHTML = `We offer a <strong>30-day money-back guarantee</strong> on all products with free return shipping. You can initiate a replacement right from our <a href="${getBasePrefix()}customer-service.html" style="color:#2563eb;font-weight:700;text-decoration:underline;">Returns Portal</a>.`;
        } else if (lower.includes("discount") || lower.includes("coupon") || lower.includes("promo") || lower.includes("code") || lower.includes("offer")) {
            botMsg.innerHTML = `Use coupon code <strong style="color:#2563eb;background:#eff6ff;padding:2px 6px;border-radius:4px;">QMART20</strong> at checkout to save <strong>20% off</strong> your purchase today!`;
        } else if (lower.includes("shipping") || lower.includes("delivery") || lower.includes("time") || lower.includes("cost")) {
            botMsg.innerHTML = `Standard shipping is <strong>FREE</strong> for orders over $50 ($4.99 otherwise). Orders arrive within 3-5 business days via FedEx/DHL.`;
        } else if (lower.includes("contact") || lower.includes("phone") || lower.includes("email") || lower.includes("human")) {
            botMsg.innerHTML = `You can reach our senior support staff directly at <strong>support@qmart.com</strong> or call toll-free at <strong>+91 98765 43210</strong> (available 24/7).`;
        } else {
            botMsg.innerHTML = `Thank you for asking! I've logged your request. For personalized assistance, you can also browse our <a href="${getBasePrefix()}customer-service.html" style="color:#2563eb;font-weight:700;text-decoration:underline;">Help Center & FAQs</a> or email <strong>support@qmart.com</strong>.`;
        }

        container.appendChild(botMsg);
        container.scrollTop = container.scrollHeight;
    }, 450);
}

function getBasePrefix() {
    const isSubfolder = window.location.pathname.includes("/home/") ||
                        window.location.pathname.includes("/cart/") ||
                        window.location.pathname.includes("/details/") ||
                        window.location.pathname.includes("/registratuion&login/");
    return isSubfolder ? "../" : "./";
}

/* ================= BOTTOM MOBILE NAVIGATION BAR ================= */
function initBottomMobileNav() {
    if (document.getElementById("bottomMobileNav")) return;

    const prefix = getBasePrefix();
    const path = window.location.pathname;

    const isHome = path.includes("home") || path.endsWith("/");
    const isShop = path.includes("catalog");
    const isCart = path.includes("cart");
    const isCS = path.includes("customer-service");
    const isAccount = path.includes("login") || path.includes("register");

    const nav = document.createElement("nav");
    nav.id = "bottomMobileNav";
    nav.className = "bottom-mobile-nav";
    nav.innerHTML = `
        <a href="${prefix}home/home.html" class="mobile-nav-item ${isHome ? "active" : ""}">
            <i class="fa-solid fa-house"></i>
            <span>Home</span>
        </a>
        <a href="${prefix}home/home.html#catalog-section" class="mobile-nav-item">
            <i class="fa-solid fa-compass"></i>
            <span>Shop</span>
        </a>
        <a href="${prefix}customer-service.html" class="mobile-nav-item ${isCS ? "active" : ""}">
            <i class="fa-solid fa-headset"></i>
            <span>Support</span>
        </a>
        <a href="${prefix}cart/cart.html" class="mobile-nav-item ${isCart ? "active" : ""}">
            <i class="fa-solid fa-bag-shopping"></i>
            <span>Cart</span>
            <span class="mobile-cart-badge cart-badge">0</span>
        </a>
        <a href="${prefix}registratuion&login/login.html" class="mobile-nav-item ${isAccount ? "active" : ""}">
            <i class="fa-regular fa-user"></i>
            <span>Account</span>
        </a>
    `;

    document.body.appendChild(nav);
}

