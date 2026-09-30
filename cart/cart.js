/**
 * Qmart E-Commerce - Shopping Cart Script (cart.js)
 */

let appliedCoupon = null; // { code: 'QMART20', discountPct: 20 }

document.addEventListener("DOMContentLoaded", () => {
    displayCart();
});

/* ================= DISPLAY CART ================= */
function displayCart() {
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch (e) {
        cart = [];
    }

    const cartContent = document.getElementById("cartContent");
    const summaryCol = document.getElementById("orderSummaryCol");
    const clearBtn = document.getElementById("clearCartBtn");
    const backBtn = document.getElementById("cartNavBack");
    const subtitle = document.getElementById("cartItemsSubtitle");

    if (!cartContent) return;

    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-cart-card">
                <div class="empty-cart-icon">
                    <i class="fa-solid fa-bag-shopping"></i>
                </div>
                <h3>Your Shopping Bag is Empty</h3>
                <p>Looks like you haven't added any products to your bag yet. Discover our curated catalog and exclusive discounts!</p>
                <a href="../home/home.html#catalog-section" class="btn btn-primary">
                    <i class="fa-solid fa-arrow-left"></i> Start Shopping
                </a>
            </div>
        `;

        const stCard = document.getElementById("shippingThresholdCard");
        if (stCard) stCard.style.display = "none";
        if (summaryCol) summaryCol.style.display = "none";
        if (clearBtn) clearBtn.style.display = "none";
        if (backBtn) backBtn.style.display = "none";
        if (subtitle) subtitle.textContent = "Your shopping bag has 0 items.";

        if (typeof updateCartBadge === "function") updateCartBadge();
        return;
    }

    // Has items
    if (summaryCol) summaryCol.style.display = "block";
    if (clearBtn) clearBtn.style.display = "inline-flex";
    if (backBtn) backBtn.style.display = "block";

    const totalQty = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    if (subtitle) subtitle.textContent = `You have ${totalQty} item${totalQty === 1 ? "" : "s"} in your bag.`;

    let subtotal = 0;
    let markup = "";

    cart.forEach((item, index) => {
        const qty = parseInt(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const itemTotal = price * qty;
        subtotal += itemTotal;

        const thumb = item.thumbnail || "https://via.placeholder.com/150?text=Product";

        markup += `
            <div class="cart-item-row" data-index="${index}">
                
                <!-- Thumb -->
                <div class="cart-item-thumb" onclick="goToCartItemDetails(${item.id})">
                    <img src="${thumb}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/150?text=Product'">
                </div>

                <!-- Details -->
                <div class="cart-item-details">
                    <div class="cart-item-meta">${item.category || "General"}</div>
                    <h3 class="cart-item-title" onclick="goToCartItemDetails(${item.id})">
                        ${item.title}
                    </h3>
                    <div class="cart-item-unit-price">Unit Price: $${price.toFixed(2)}</div>
                </div>

                <!-- Controls -->
                <div class="cart-item-controls">
                    <div class="cart-qty-stepper">
                        <button class="cart-qty-btn" onclick="updateItemQty(${index}, -1)" title="Decrease">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="cart-qty-val">${qty}</span>
                        <button class="cart-qty-btn" onclick="updateItemQty(${index}, 1)" title="Increase">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>

                    <div class="cart-item-subtotal">
                        $${itemTotal.toFixed(2)}
                    </div>

                    <button class="btn-remove-item" onclick="removeCartItem(${index})" title="Remove item">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>

            </div>
        `;
    });

    cartContent.innerHTML = markup;

    // Calculate Summary
    calculateOrderSummary(subtotal);
    if (typeof updateCartBadge === "function") updateCartBadge();
}

/* Calculate and update order summary prices */
function calculateOrderSummary(subtotal) {
    const shipping = subtotal >= 50 ? 0 : 4.99;
    const tax = subtotal * 0.08;

    let discount = 0;
    if (appliedCoupon && appliedCoupon.discountPct) {
        discount = subtotal * (appliedCoupon.discountPct / 100);
    }

    const total = Math.max(0, subtotal + shipping + tax - discount);

    // Update summary DOM
    const subtotalEl = document.getElementById("summarySubtotal");
    const shippingEl = document.getElementById("summaryShipping");
    const taxEl = document.getElementById("summaryTax");
    const totalEl = document.getElementById("summaryTotal");
    const discountRow = document.getElementById("discountRow");
    const discountEl = document.getElementById("summaryDiscount");
    const appliedCodeText = document.getElementById("appliedCodeText");

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

    // Update Shipping Threshold Tracker
    const stCard = document.getElementById("shippingThresholdCard");
    const stMsg = document.getElementById("stMessage");
    const stFill = document.getElementById("stFill");
    if (stCard && stMsg && stFill) {
        stCard.style.display = "block";
        if (subtotal >= 50) {
            stFill.style.width = "100%";
            stMsg.innerHTML = `🎉 You've unlocked <strong>FREE Standard Shipping</strong>!`;
        } else {
            const diff = (50 - subtotal).toFixed(2);
            const pct = Math.min(100, Math.round((subtotal / 50) * 100));
            stFill.style.width = `${pct}%`;
            stMsg.innerHTML = `Add <strong>$${diff}</strong> more to qualify for <strong>FREE Shipping</strong>!`;
        }
    }

    if (shippingEl) {
        if (shipping === 0) {
            shippingEl.innerHTML = `<span style="color:var(--success);font-weight:700;">FREE</span>`;
        } else {
            shippingEl.textContent = `$${shipping.toFixed(2)}`;
        }
    }

    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;

    if (discountRow && discountEl) {
        if (discount > 0 && appliedCoupon) {
            discountRow.style.display = "flex";
            discountEl.textContent = `-$${discount.toFixed(2)}`;
            if (appliedCodeText) appliedCodeText.textContent = appliedCoupon.code;
        } else {
            discountRow.style.display = "none";
        }
    }

    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    const modalTotal = document.getElementById("modalTotalAmount");
    if (modalTotal) modalTotal.textContent = `$${total.toFixed(2)}`;

    return total;
}

/* ================= CART ACTIONS ================= */
function updateItemQty(index, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (!cart[index]) return;

    let currentQty = parseInt(cart[index].quantity) || 1;
    currentQty += change;

    if (currentQty <= 0) {
        removeCartItem(index);
        return;
    }

    cart[index].quantity = currentQty;
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
}

function removeCartItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart[index]) {
        const title = cart[index].title;
        cart.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        displayCart();

        if (typeof showToast === "function") {
            showToast("Item Removed", `"${title}" was removed from your bag.`);
        }
    }
}

function clearAllCart() {
    if (confirm("Are you sure you want to remove all items from your shopping bag?")) {
        localStorage.removeItem("cart");
        displayCart();
        if (typeof showToast === "function") {
            showToast("Shopping Bag Cleared", "All items have been removed.");
        }
    }
}

function goToCartItemDetails(productId) {
    localStorage.setItem("pid", productId);
    window.location.href = "../details/details.html";
}

/* ================= COUPON CODES ================= */
function applyCoupon() {
    const input = document.getElementById("couponInput");
    const feedback = document.getElementById("couponMsg");
    if (!input || !feedback) return;

    const code = input.value.trim().toUpperCase();

    if (code === "QMART20") {
        appliedCoupon = { code: "QMART20", discountPct: 20 };
        feedback.className = "coupon-feedback success";
        feedback.textContent = "Coupon QMART20 applied! 20% discount added.";
        feedback.style.display = "block";
        displayCart();
    } else if (code === "QMART10") {
        appliedCoupon = { code: "QMART10", discountPct: 10 };
        feedback.className = "coupon-feedback success";
        feedback.textContent = "Coupon QMART10 applied! 10% discount added.";
        feedback.style.display = "block";
        displayCart();
    } else {
        feedback.className = "coupon-feedback error";
        feedback.textContent = "Invalid coupon code. Try using QMART20.";
        feedback.style.display = "block";
    }
}

/* ================= CHECKOUT MODAL FLOW ================= */
function openCheckoutModal() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

function handlePlaceOrder(event) {
    event.preventDefault();

    const orderNum = "#QM-" + Math.floor(10000 + Math.random() * 90000);
    const totalEl = document.getElementById("summaryTotal");
    const totalAmount = totalEl ? totalEl.textContent : "$0.00";

    // Set receipt details
    const receiptOrder = document.getElementById("receiptOrderNum");
    const receiptAmount = document.getElementById("receiptAmount");
    const receiptDate = document.getElementById("receiptDeliveryDate");

    if (receiptOrder) receiptOrder.textContent = orderNum;
    if (receiptAmount) receiptAmount.textContent = totalAmount;

    // Delivery in 3-5 days
    const delivDate = new Date();
    delivDate.setDate(delivDate.getDate() + 3);
    if (receiptDate) {
        receiptDate.textContent = delivDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });
    }

    // Clear cart
    localStorage.removeItem("cart");

    // Close checkout modal, open success modal
    closeCheckoutModal();
    const successModal = document.getElementById("orderSuccessModal");
    if (successModal) {
        successModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    if (typeof updateCartBadge === "function") updateCartBadge();
}