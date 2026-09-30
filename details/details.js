/**
 * Qmart E-Commerce - Product Details Page Script (details.js)
 */

let currentProduct = null;
let currentQuantity = 1;
let currentReviewRating = 5;
let productReviews = [];

document.addEventListener("DOMContentLoaded", () => {
    initDetailsPage();
});

function initDetailsPage() {
    let pid = localStorage.getItem("pid");
    if (!pid) {
        pid = 1;
        localStorage.setItem("pid", 1);
    }

    loadProductDetails(pid);
}

function loadProductDetails(pid) {
    let allproducts = [];
    try {
        allproducts = JSON.parse(localStorage.getItem("allproducts")) || [];
    } catch (e) {
        allproducts = [];
    }

    let found = allproducts.find((p) => p.id == pid);

    if (found) {
        setupLoadedProduct(found, allproducts);
    } else {
        fetch(`https://dummyjson.com/products/${pid}`)
            .then((res) => {
                if (!res.ok) throw new Error("Product fetch failed");
                return res.json();
            })
            .then((product) => {
                fetch(`https://dummyjson.com/products/category/${product.category}`)
                    .then((r) => r.json())
                    .then((d) => setupLoadedProduct(product, d.products || []))
                    .catch(() => setupLoadedProduct(product, [product]));
            })
            .catch((err) => {
                console.error("Error loading product:", err);
                document.getElementById("productDetails").innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <h3>Product Not Found</h3>
                        <p>The product you are looking for is unavailable or has been removed from our catalog.</p>
                        <a href="../home/home.html" class="btn btn-primary">Return to Catalog</a>
                    </div>
                `;
            });
    }
}

function setupLoadedProduct(product, catalogList) {
    currentProduct = product;
    productReviews = [...(product.reviews || [])];

    renderProductShowcase(product);
    renderProductTabs(product);
    renderRelatedProducts(product, catalogList);

    const tabsSec = document.getElementById("productTabsSection");
    if (tabsSec) tabsSec.style.display = "block";
}

/* ================= RENDER PRODUCT SHOWCASE ================= */
function renderProductShowcase(product) {
    const container = document.getElementById("productDetails");
    const breadcrumbCat = document.getElementById("breadcrumbCategory");
    const breadcrumbTitle = document.getElementById("breadcrumbTitle");

    if (breadcrumbCat) breadcrumbCat.textContent = capitalize(product.category || "Catalog");
    if (breadcrumbTitle) breadcrumbTitle.textContent = product.title;
    document.title = `${product.title} | Qmart Store`;

    const discountPct = Math.round(product.discountPercentage || 0);
    let originalPriceMarkup = "";
    if (discountPct > 0) {
        const oldVal = (product.price / (1 - discountPct / 100)).toFixed(2);
        originalPriceMarkup = `
            <span class="price-original">$${oldVal}</span>
            <span class="price-save-badge">Save ${discountPct}%</span>
        `;
    }

    const images = (product.images && product.images.length > 0) ? product.images : [product.thumbnail];
    const mainImgSrc = images[0] || product.thumbnail;

    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const isWishlisted = wishlist.includes(product.id);
    const wishlistClass = isWishlisted ? "btn-details-wishlist active" : "btn-details-wishlist";
    const heartIcon = isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart";

    const isLowStock = product.stock < 10;
    const stockClass = isLowStock ? "stock-pill low" : "stock-pill";
    const stockLabel = isLowStock ? `Only ${product.stock} left in stock!` : `In Stock - Ready to Ship`;

    container.innerHTML = `
        <main>
            <div class="prod_container">

                <!-- Left Column: Gallery -->
                <div class="gallery-column">
                    <div class="main-image-wrap">
                        ${discountPct > 5 ? `<span class="badge-discount-float">-${discountPct}%</span>` : ""}
                        <img id="mainProductImage" src="${mainImgSrc}" alt="${product.title}">
                    </div>

                    ${images.length > 1 ? `
                        <div class="thumbnails-row">
                            ${images.map((img, idx) => `
                                <div class="thumb-item ${idx === 0 ? "active" : ""}" onclick="switchMainImage('${img}', this)">
                                    <img src="${img}" alt="Thumbnail ${idx + 1}">
                                </div>
                            `).join("")}
                        </div>
                    ` : ""}
                </div>

                <!-- Right Column: Product Information -->
                <div class="prod_info">

                    <div class="prod-meta-strip">
                        <span class="category-tag">${product.category || "General"}</span>
                        ${product.brand ? `<span class="brand-tag">Brand: <strong>${product.brand}</strong></span>` : ""}
                        <span class="sku-code">SKU: ${product.sku || "QM-" + product.id}</span>
                    </div>

                    <h1 id="title">${product.title}</h1>

                    <!-- Rating Summary -->
                    <div class="rating-summary-row">
                        <div class="stars-group">
                            ${getStarMarkup(product.rating || 4.5)}
                        </div>
                        <span class="rating-value">${Number(product.rating || 4.5).toFixed(1)} / 5.0</span>
                        <a href="#productTabsSection" onclick="switchProductTab('tab-reviews')" class="reviews-link">(${productReviews.length} customer reviews)</a>

                        <div class="${stockClass}">
                            <span class="dot"></span>
                            <span>${stockLabel}</span>
                        </div>
                    </div>

                    <!-- Price Block -->
                    <div class="price-block">
                        <span class="price-main">$${Number(product.price).toFixed(2)}</span>
                        ${originalPriceMarkup}
                    </div>

                    <!-- Description -->
                    <p id="description">${product.description}</p>

                    <!-- ZIP Delivery Estimator -->
                    <div class="delivery-checker-box">
                        <div class="dc-label">
                            <i class="fa-solid fa-location-dot" style="color:var(--primary);"></i>
                            <span>Check Estimated Delivery Date</span>
                        </div>
                        <div class="dc-input-row">
                            <input type="text" id="zipInput" placeholder="Enter 6-digit postal code (e.g. 500081)">
                            <button type="button" onclick="checkDeliveryDate()">Check</button>
                        </div>
                        <div id="dcResult" class="dc-result" style="display:none;"></div>
                    </div>

                    <!-- Purchase Controls -->
                    <div class="purchase-controls">
                        <div class="quantity-stepper">
                            <button class="qty-btn" onclick="stepQuantity(-1)"><i class="fa-solid fa-minus"></i></button>
                            <input type="text" id="detailQty" class="qty-input" value="1" readonly>
                            <button class="qty-btn" onclick="stepQuantity(1)"><i class="fa-solid fa-plus"></i></button>
                        </div>

                        <button class="btn-add-cart" onclick="detailsAddToCart()">
                            <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                        </button>

                        <button class="btn-buy-now" onclick="detailsBuyNow()">
                            Buy Now
                        </button>

                        <button class="${wishlistClass}" id="detailsWishlistBtn" onclick="detailsToggleWishlist()" title="Save item">
                            <i class="${heartIcon}"></i>
                        </button>
                    </div>

                    <!-- Trust Guarantees -->
                    <div class="guarantees-row">
                        <div class="guarantee-item">
                            <i class="fa-solid fa-certificate"></i> 100% Verified Authentic
                        </div>
                        <div class="guarantee-item">
                            <i class="fa-solid fa-shield-halved"></i> 256-Bit SSL Checkout
                        </div>
                        <div class="guarantee-item">
                            <i class="fa-solid fa-rotate-left"></i> 30-Day Money Back
                        </div>
                    </div>

                </div>

            </div>
        </main>
    `;
}

function switchMainImage(src, thumbElement) {
    const mainImg = document.getElementById("mainProductImage");
    if (mainImg) {
        mainImg.style.opacity = "0.4";
        setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = "1";
        }, 100);
    }
    document.querySelectorAll(".thumb-item").forEach((el) => el.classList.remove("active"));
    if (thumbElement) thumbElement.classList.add("active");
}

function stepQuantity(amount) {
    const input = document.getElementById("detailQty");
    if (!input || !currentProduct) return;

    let val = parseInt(input.value) || 1;
    val += amount;

    if (val < 1) val = 1;
    if (val > (currentProduct.stock || 50)) val = currentProduct.stock || 50;

    currentQuantity = val;
    input.value = val;
}

function checkDeliveryDate() {
    const zip = document.getElementById("zipInput").value.trim();
    const res = document.getElementById("dcResult");
    if (!res) return;

    if (!zip || zip.length < 4) {
        res.style.color = "var(--danger)";
        res.textContent = "Please enter a valid postal code.";
        res.style.display = "block";
        return;
    }

    const deliv = new Date();
    deliv.setDate(deliv.getDate() + 3);
    const dateStr = deliv.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    res.style.color = "var(--success)";
    res.innerHTML = `<i class="fa-solid fa-circle-check"></i> Standard Delivery to ${zip} by <strong>${dateStr}</strong> (FREE over $50)`;
    res.style.display = "block";
}

/* ================= TABS RENDERING ================= */
function renderProductTabs(product) {
    // 1. Overview
    const overviewEl = document.getElementById("tabOverviewText");
    const warrantyEl = document.getElementById("tabWarrantyText");
    const shipEl = document.getElementById("tabShippingText");

    if (overviewEl) overviewEl.textContent = product.description;
    if (warrantyEl) warrantyEl.textContent = product.warrantyInformation || "1 Year Official Brand Warranty included.";
    if (shipEl) shipEl.textContent = product.shippingInformation || "Orders dispatch within 24 hours with full tracking.";

    // 2. Specs Table
    const specsEl = document.getElementById("tabSpecsTable");
    if (specsEl) {
        specsEl.innerHTML = `
            <table>
                <tbody>
                    <tr><th>Brand</th><td>${product.brand || "General"}</td></tr>
                    <tr><th>Category</th><td>${product.category || "General"}</td></tr>
                    <tr><th>Product SKU</th><td>${product.sku || "QM-" + product.id}</td></tr>
                    <tr><th>Dimensions</th><td>${product.dimensions ? `${product.dimensions.width}W × ${product.dimensions.height}H × ${product.dimensions.depth}D cm` : "Standard retail packaging"}</td></tr>
                    <tr><th>Package Weight</th><td>${product.weight ? product.weight + " oz" : "0.5 kg"}</td></tr>
                    <tr><th>Warranty Terms</th><td>${product.warrantyInformation || "1 Year Manufacturer Guarantee"}</td></tr>
                    <tr><th>Return Eligibility</th><td>${product.returnPolicy || "30-Day Hassle-Free Returns"}</td></tr>
                </tbody>
            </table>
        `;
    }

    // 3. Reviews
    renderReviewsList();
}

function switchProductTab(tabId, btn) {
    document.querySelectorAll(".prod-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

    if (btn) btn.classList.add("active");
    else {
        const matchingBtn = document.querySelector(`.prod-tab-btn[data-tab="${tabId}"]`);
        if (matchingBtn) matchingBtn.classList.add("active");
    }

    const pane = document.getElementById(tabId);
    if (pane) pane.classList.add("active");
}

/* ================= REVIEWS RENDERING ================= */
function renderReviewsList() {
    const listCol = document.getElementById("reviewsList");
    const tabCount = document.getElementById("tabReviewCount");
    const totalRatingsTxt = document.getElementById("totalRatingsTxt");
    const avgNum = document.getElementById("avgScoreNum");
    const avgStars = document.getElementById("avgScoreStars");

    if (!listCol) return;

    if (productReviews.length === 0) {
        productReviews = [
            {
                rating: 5,
                reviewerName: "Rachel Miller",
                comment: "Top quality product. Arrived neatly packaged in 3 days. Exactly as described!",
                date: "2026-02-18"
            },
            {
                rating: 5,
                reviewerName: "David Lee",
                comment: "Best purchase I've made this year. High quality materials and works flawlessly.",
                date: "2026-01-30"
            },
            {
                rating: 4,
                reviewerName: "Anita Rao",
                comment: "Very pleased with the performance and price. Would definitely buy again from Qmart.",
                date: "2026-01-14"
            }
        ];
    }

    const count = productReviews.length;
    if (tabCount) tabCount.textContent = count;
    if (totalRatingsTxt) totalRatingsTxt.textContent = `Based on ${count} verified reviews`;

    // Calculate real average
    const totalSum = productReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avg = (totalSum / count).toFixed(1);
    if (avgNum) avgNum.textContent = avg;
    if (avgStars) avgStars.innerHTML = getStarMarkup(Number(avg));

    listCol.innerHTML = productReviews.map((rev) => {
        const initials = (rev.reviewerName || "Buyer").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        const dateStr = rev.date ? new Date(rev.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Recent";

        return `
            <div class="review-item-card">
                <div class="review-card-header">
                    <div class="rev-user-meta">
                        <div class="rev-avatar">${initials}</div>
                        <div>
                            <span class="rev-name">${rev.reviewerName || "Verified Buyer"}</span>
                            <span class="rev-badge"><i class="fa-solid fa-circle-check"></i> Verified Purchase</span>
                        </div>
                    </div>
                    <span class="rev-date">${dateStr}</span>
                </div>
                <div class="rev-stars">
                    ${getStarMarkup(rev.rating || 5)}
                </div>
                <p class="rev-text">"${rev.comment || "Great product, highly recommend!"}"</p>
            </div>
        `;
    }).join("");
}

/* ================= WRITE REVIEW MODAL ================= */
function openWriteReviewModal() {
    const modal = document.getElementById("writeReviewModal");
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

function closeWriteReviewModal() {
    const modal = document.getElementById("writeReviewModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

function setRatingPick(stars) {
    currentReviewRating = stars;
    const picks = document.querySelectorAll(".star-pick");
    picks.forEach((pick) => {
        const val = parseInt(pick.getAttribute("data-val"));
        if (val <= stars) pick.classList.add("active");
        else pick.classList.remove("active");
    });
}

function handleReviewSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("reviewerNameInput").value.trim();
    const comment = document.getElementById("reviewerCommentInput").value.trim();

    const newRev = {
        rating: currentReviewRating,
        reviewerName: name || "Verified Buyer",
        comment: comment,
        date: new Date().toISOString()
    };

    productReviews.unshift(newRev);
    renderReviewsList();
    closeWriteReviewModal();

    if (typeof showToast === "function") {
        showToast("Review Published!", "Thank you for sharing your feedback with the Qmart community.");
    }
}

/* ================= RELATED PRODUCTS ================= */
function renderRelatedProducts(product, allList) {
    const grid = document.getElementById("relatedProductsGrid");
    const section = document.getElementById("relatedSection");
    if (!grid || !section) return;

    const related = allList.filter((p) => p.category === product.category && p.id != product.id).slice(0, 4);

    if (related.length === 0) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    grid.innerHTML = related.map((val) => `
        <div class="product-card" onclick="openRelated(${val.id})">
            <div class="card-media-box">
                <img src="${val.thumbnail}" alt="${val.title}" loading="lazy">
            </div>
            <div class="card-body">
                <span class="card-category">${val.category}</span>
                <h3 class="card-title">${val.title}</h3>
                <div class="card-price-row">
                    <span class="card-price">$${Number(val.price).toFixed(2)}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-card-cart" onclick="event.stopPropagation(); quickAddRelated(${val.id})">
                        <i class="fa-solid fa-cart-plus"></i> Add
                    </button>
                    <button class="btn-card-quick" onclick="event.stopPropagation(); openRelated(${val.id})">
                        View
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

function openRelated(productId) {
    localStorage.setItem("pid", productId);
    window.location.reload();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function quickAddRelated(productId) {
    let all = JSON.parse(localStorage.getItem("allproducts")) || [];
    let p = all.find((item) => item.id == productId);
    if (p && typeof addToCartGlobal === "function") {
        addToCartGlobal(p, 1, true);
    }
}

/* ================= CART & WISHLIST ================= */
function detailsAddToCart() {
    if (!currentProduct) return;
    if (typeof addToCartGlobal === "function") {
        addToCartGlobal(currentProduct, currentQuantity, true);
    }
}

function detailsBuyNow() {
    if (!currentProduct) return;
    if (typeof addToCartGlobal === "function") {
        addToCartGlobal(currentProduct, currentQuantity, false);
    }
    window.location.href = "../cart/cart.html";
}

function detailsToggleWishlist() {
    if (!currentProduct) return;
    if (typeof toggleWishlistGlobal === "function") {
        const added = toggleWishlistGlobal(currentProduct.id, currentProduct.title, currentProduct.thumbnail);
        const btn = document.getElementById("detailsWishlistBtn");
        if (btn) {
            if (added) {
                btn.classList.add("active");
                btn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
            } else {
                btn.classList.remove("active");
                btn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
            }
        }
    }
}

/* Helpers */
function getStarMarkup(rating) {
    const full = Math.floor(rating);
    let s = "";
    for (let i = 0; i < full && i < 5; i++) s += `<i class="fa-solid fa-star"></i>`;
    if (rating - full >= 0.4 && full < 5) s += `<i class="fa-solid fa-star-half-stroke"></i>`;
    const empty = 5 - Math.ceil(rating);
    for (let i = 0; i < empty; i++) s += `<i class="fa-regular fa-star"></i>`;
    return s;
}

function capitalize(str) {
    return (str || "").charAt(0).toUpperCase() + (str || "").slice(1);
}
