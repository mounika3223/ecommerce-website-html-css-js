/**
 * Qmart E-Commerce - Home Page Dynamic Retail Script (home.js)
 * Full Responsive Navigation, Multi-Dimensional Product Filtering & Catalog Experience
 */

let allProducts = [];
let filteredProducts = [];
let displayedCount = 12;

// Central Filter State
const filterState = {
    category: "all",
    priceRange: "all",
    minPrice: null,
    maxPrice: null,
    minRating: 0,
    inStockOnly: false,
    onSaleOnly: false,
    search: "",
    sort: "default"
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initHomePage();
    initLiveSearch();
});

function initHomePage() {
    checkUrlParameters();
    fetchProducts();
    setupGlobalShortcuts();
}

// SEO Parameter Checker: supports ?q=term and ?dept=category
function checkUrlParameters() {
    try {
        const params = new URLSearchParams(window.location.search);
        const query = params.get("q") || params.get("search_term_string");
        const dept = params.get("dept") || params.get("category");

        if (query) {
            filterState.search = query;
            const searchInput = document.getElementById("searchproduct");
            if (searchInput) searchInput.value = query;
            const clearBtn = document.getElementById("clearSearchBtn");
            if (clearBtn) clearBtn.style.display = "block";
        }

        if (dept) {
            filterState.category = dept;
        }
    } catch (e) {
        console.warn("URL search parameter parsing skipped", e);
    }
}

/* ================= 1. FETCH & INITIALIZE PRODUCTS ================= */
function fetchProducts() {
    // 1. Try local cache first for instant load
    const cached = localStorage.getItem("allproducts");
    if (cached) {
        try {
            allProducts = JSON.parse(cached);
            if (Array.isArray(allProducts) && allProducts.length > 0) {
                populateCategoryFilterList();
                applyFilters();
            }
        } catch (e) {
            console.warn("Cached products invalid, refreshing from API...");
        }
    }

    // 2. Fetch fresh 50 items from DummyJSON
    fetch("https://dummyjson.com/products?limit=50")
        .then((res) => {
            if (!res.ok) throw new Error("Catalog service unavailable");
            return res.json();
        })
        .then((data) => {
            if (data && data.products) {
                allProducts = data.products;
                localStorage.setItem("allproducts", JSON.stringify(allProducts));
                populateCategoryFilterList();
                applyFilters();
            }
        })
        .catch((err) => {
            console.error("Fetch error:", err);
            const container = document.getElementById("productcontainer");
            if (container && (!allProducts || allProducts.length === 0)) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <h3>Unable to load catalog</h3>
                        <p>We encountered an issue loading our product catalog. Please retry.</p>
                        <button class="btn btn-primary" onclick="fetchProducts()">Retry Connection</button>
                    </div>
                `;
            }
        });
}

/* ================= 2. DYNAMIC CATEGORY FILTER SIDEBAR ================= */
function populateCategoryFilterList() {
    const listContainer = document.getElementById("categoryFilterList");
    if (!listContainer || !allProducts.length) return;

    // Count products per category
    const catCounts = { all: allProducts.length };
    allProducts.forEach((p) => {
        const cat = (p.category || "other").toLowerCase();
        catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    // Friendly display names
    const categoryLabels = {
        all: "All Departments",
        laptops: "Computers & Tech",
        smartphones: "Smartphones & Mobile",
        fragrances: "Luxury Fragrances",
        beauty: "Beauty & Skincare",
        groceries: "Groceries & Pantry",
        "home-decoration": "Home & Living",
        furniture: "Furniture & Decor",
        tops: "Apparel & Tops",
        "womens-dresses": "Women's Fashion",
        "mens-shirts": "Men's Fashion",
        "mens-shoes": "Footwear",
        motorcycle: "Automotive & Gear",
        skin_care: "Skincare Essentials"
    };

    const categories = Object.keys(catCounts);

    listContainer.innerHTML = categories.map((catKey) => {
        const isChecked = filterState.category === catKey ? "checked" : "";
        const label = categoryLabels[catKey] || formatCategoryName(catKey);
        const count = catCounts[catKey];

        return `
            <label class="filter-checkbox-label">
                <input type="radio" 
                       name="categoryFilter" 
                       value="${catKey}" 
                       ${isChecked} 
                       onchange="handleCategoryRadio('${catKey}')">
                <span>${label}</span>
                <span class="filter-count-badge">${count}</span>
            </label>
        `;
    }).join("");
}

function formatCategoryName(slug) {
    return slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/* ================= 3. FILTER EVENT HANDLERS ================= */

// Category handler
function handleCategoryRadio(catKey) {
    filterState.category = catKey;
    syncNavLinks(catKey);
    applyFilters();
}

// Nav link filter click (from secondary nav or mobile menu)
function filterDepartment(deptKey) {
    filterState.category = deptKey;

    // Update sidebar radio
    const radio = document.querySelector(`input[name="categoryFilter"][value="${deptKey}"]`);
    if (radio) radio.checked = true;

    syncNavLinks(deptKey);
    applyFilters();

    const catalog = document.getElementById("catalog-section");
    if (catalog) {
        catalog.scrollIntoView({ behavior: "smooth" });
    }
}

function syncNavLinks(deptKey) {
    document.querySelectorAll(".dept-link").forEach((link) => {
        const onclickAttr = link.getAttribute("onclick") || "";
        if (onclickAttr.includes(`'${deptKey}'`) || (deptKey === "all" && link.textContent.trim() === "All Products")) {
            link.classList.add("active");
        } else if (!onclickAttr.includes("filterDepartment") && deptKey === "all" && link.textContent.trim() === "Home") {
            // Keep Home or All Products clear
        } else {
            link.classList.remove("active");
        }
    });
}

// Price preset handler
function handlePriceRadio(range) {
    filterState.priceRange = range;
    filterState.minPrice = null;
    filterState.maxPrice = null;

    // Clear custom input fields
    const minInput = document.getElementById("minPriceInput");
    const maxInput = document.getElementById("maxPriceInput");
    if (minInput) minInput.value = "";
    if (maxInput) maxInput.value = "";

    applyFilters();
}

// Custom Price Min/Max handler
function applyCustomPrice() {
    const minVal = parseFloat(document.getElementById("minPriceInput")?.value);
    const maxVal = parseFloat(document.getElementById("maxPriceInput")?.value);

    if (isNaN(minVal) && isNaN(maxVal)) {
        if (typeof showToast === "function") {
            showToast("Price Filter", "Please enter a valid minimum or maximum amount.");
        }
        return;
    }

    filterState.priceRange = "custom";
    filterState.minPrice = isNaN(minVal) ? 0 : minVal;
    filterState.maxPrice = isNaN(maxVal) ? Infinity : maxVal;

    // Uncheck price radios
    document.querySelectorAll('input[name="priceRange"]').forEach(r => r.checked = false);

    applyFilters();
}

// Customer rating handler
function handleRatingFilter(minRating) {
    filterState.minRating = Number(minRating);
    applyFilters();
}

// In-stock toggle handler
function handleStockFilter(isChecked) {
    filterState.inStockOnly = isChecked;
    applyFilters();
}

// On-sale toggle handler
function handleSaleFilter(isChecked) {
    filterState.onSaleOnly = isChecked;
    applyFilters();
}

// Hero banner "View On-Sale Deals" CTA
function filterDealsOnly() {
    filterState.onSaleOnly = true;
    const saleCheckbox = document.getElementById("onSaleCheckbox");
    if (saleCheckbox) saleCheckbox.checked = true;

    applyFilters();

    const catalog = document.getElementById("catalog-section");
    if (catalog) {
        catalog.scrollIntoView({ behavior: "smooth" });
    }
}

// Sort dropdown sync
function syncSort(sortVal) {
    filterState.sort = sortVal;

    const desktopSort = document.getElementById("sortProducts");
    const mobileSort = document.getElementById("mobileSortSelect");

    if (desktopSort && desktopSort.value !== sortVal) desktopSort.value = sortVal;
    if (mobileSort && mobileSort.value !== sortVal) mobileSort.value = sortVal;

    applyFilters();
}

// Reset all filters to default
function resetAllFilters() {
    filterState.category = "all";
    filterState.priceRange = "all";
    filterState.minPrice = null;
    filterState.maxPrice = null;
    filterState.minRating = 0;
    filterState.inStockOnly = false;
    filterState.onSaleOnly = false;
    filterState.search = "";

    // Reset Form Controls
    const catAllRadio = document.querySelector('input[name="categoryFilter"][value="all"]');
    if (catAllRadio) catAllRadio.checked = true;

    const priceAllRadio = document.querySelector('input[name="priceRange"][value="all"]');
    if (priceAllRadio) priceAllRadio.checked = true;

    const ratingAllRadio = document.querySelector('input[name="minRating"][value="0"]');
    if (ratingAllRadio) ratingAllRadio.checked = true;

    const stockCheck = document.getElementById("inStockCheckbox");
    if (stockCheck) stockCheck.checked = false;

    const saleCheck = document.getElementById("onSaleCheckbox");
    if (saleCheck) saleCheck.checked = false;

    const minInput = document.getElementById("minPriceInput");
    const maxInput = document.getElementById("maxPriceInput");
    if (minInput) minInput.value = "";
    if (maxInput) maxInput.value = "";

    const searchInput = document.getElementById("searchproduct");
    const clearSearch = document.getElementById("clearSearchBtn");
    if (searchInput) searchInput.value = "";
    if (clearSearch) clearSearch.style.display = "none";

    syncNavLinks("all");
    applyFilters();
}

/* ================= 4. CORE FILTERING & SORTING LOGIC ================= */
function applyFilters() {
    let list = [...allProducts];

    // 1. Department / Category
    if (filterState.category !== "all") {
        list = list.filter((p) => (p.category || "").toLowerCase() === filterState.category.toLowerCase());
    }

    // 2. Search Query
    if (filterState.search.trim()) {
        const q = filterState.search.toLowerCase().trim();
        list = list.filter((p) => {
            return (p.title || "").toLowerCase().includes(q) ||
                   (p.brand || "").toLowerCase().includes(q) ||
                   (p.category || "").toLowerCase().includes(q) ||
                   (p.description || "").toLowerCase().includes(q);
        });
    }

    // 3. Price Range
    if (filterState.priceRange === "under25") {
        list = list.filter((p) => p.price < 25);
    } else if (filterState.priceRange === "25to100") {
        list = list.filter((p) => p.price >= 25 && p.price <= 100);
    } else if (filterState.priceRange === "100to500") {
        list = list.filter((p) => p.price >= 100 && p.price <= 500);
    } else if (filterState.priceRange === "over500") {
        list = list.filter((p) => p.price > 500);
    } else if (filterState.priceRange === "custom") {
        const min = filterState.minPrice !== null ? filterState.minPrice : 0;
        const max = filterState.maxPrice !== null ? filterState.maxPrice : Infinity;
        list = list.filter((p) => p.price >= min && p.price <= max);
    }

    // 4. Customer Rating
    if (filterState.minRating > 0) {
        list = list.filter((p) => (p.rating || 0) >= filterState.minRating);
    }

    // 5. In Stock Only
    if (filterState.inStockOnly) {
        list = list.filter((p) => (p.stock || 0) > 0);
    }

    // 6. On-Sale (Discounted)
    if (filterState.onSaleOnly) {
        list = list.filter((p) => (p.discountPercentage || 0) > 5);
    }

    // 7. Sorting
    switch (filterState.sort) {
        case "price-low":
            list.sort((a, b) => a.price - b.price);
            break;
        case "price-high":
            list.sort((a, b) => b.price - a.price);
            break;
        case "rating":
            list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case "discount":
            list.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
            break;
        case "title-az":
            list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
            break;
        default:
            // Default: featured (maintain default catalog ordering)
            break;
    }

    filteredProducts = list;
    displayedCount = 12; // Reset pagination

    renderActiveFilterChips();
    updateFilterCounts();
    renderProducts();
    updateUrlParams();
}

// Keep browser URL synced with search query for SEO and shareability
function updateUrlParams() {
    try {
        const params = new URLSearchParams();
        if (filterState.search && filterState.search.trim()) {
            params.set("q", filterState.search.trim());
        }
        if (filterState.category && filterState.category !== "all") {
            params.set("dept", filterState.category);
        }
        const qs = params.toString();
        const newUrl = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
        window.history.replaceState(null, "", newUrl);
    } catch (e) {
        // Fallback
    }
}

/* ================= 5. ACTIVE FILTER CHIPS & COUNTS ================= */
function renderActiveFilterChips() {
    const chipsContainer = document.getElementById("activeFilterTags");
    if (!chipsContainer) return;

    const chips = [];

    // Category chip
    if (filterState.category !== "all") {
        chips.push({
            label: `Dept: ${formatCategoryName(filterState.category)}`,
            action: "category"
        });
    }

    // Price chip
    if (filterState.priceRange === "under25") {
        chips.push({ label: "Under $25", action: "price" });
    } else if (filterState.priceRange === "25to100") {
        chips.push({ label: "$25 to $100", action: "price" });
    } else if (filterState.priceRange === "100to500") {
        chips.push({ label: "$100 to $500", action: "price" });
    } else if (filterState.priceRange === "over500") {
        chips.push({ label: "Over $500", action: "price" });
    } else if (filterState.priceRange === "custom") {
        const maxStr = filterState.maxPrice === Infinity ? "+" : `-$${filterState.maxPrice}`;
        chips.push({ label: `$${filterState.minPrice}${maxStr}`, action: "price" });
    }

    // Rating chip
    if (filterState.minRating > 0) {
        chips.push({ label: `${filterState.minRating}★ & Above`, action: "rating" });
    }

    // Stock chip
    if (filterState.inStockOnly) {
        chips.push({ label: "In Stock Only", action: "stock" });
    }

    // On-sale chip
    if (filterState.onSaleOnly) {
        chips.push({ label: "On Sale Deals", action: "sale" });
    }

    // Search query chip
    if (filterState.search.trim()) {
        chips.push({ label: `"${filterState.search.trim()}"`, action: "search" });
    }

    if (chips.length === 0) {
        chipsContainer.innerHTML = "";
        return;
    }

    chipsContainer.innerHTML = chips.map((c) => `
        <span class="filter-tag-chip">
            ${c.label}
            <i class="fa-solid fa-xmark" onclick="removeSpecificFilter('${c.action}')" title="Remove filter"></i>
        </span>
    `).join("") + `
        <button class="filter-clear-all-btn" onclick="resetAllFilters()">Clear All</button>
    `;
}

function removeSpecificFilter(action) {
    if (action === "category") {
        filterState.category = "all";
        const catAllRadio = document.querySelector('input[name="categoryFilter"][value="all"]');
        if (catAllRadio) catAllRadio.checked = true;
        syncNavLinks("all");
    } else if (action === "price") {
        filterState.priceRange = "all";
        filterState.minPrice = null;
        filterState.maxPrice = null;
        const priceAllRadio = document.querySelector('input[name="priceRange"][value="all"]');
        if (priceAllRadio) priceAllRadio.checked = true;
        const minInput = document.getElementById("minPriceInput");
        const maxInput = document.getElementById("maxPriceInput");
        if (minInput) minInput.value = "";
        if (maxInput) maxInput.value = "";
    } else if (action === "rating") {
        filterState.minRating = 0;
        const ratingAllRadio = document.querySelector('input[name="minRating"][value="0"]');
        if (ratingAllRadio) ratingAllRadio.checked = true;
    } else if (action === "stock") {
        filterState.inStockOnly = false;
        const stockCheck = document.getElementById("inStockCheckbox");
        if (stockCheck) stockCheck.checked = false;
    } else if (action === "sale") {
        filterState.onSaleOnly = false;
        const saleCheck = document.getElementById("onSaleCheckbox");
        if (saleCheck) saleCheck.checked = false;
    } else if (action === "search") {
        filterState.search = "";
        const searchInput = document.getElementById("searchproduct");
        const clearSearch = document.getElementById("clearSearchBtn");
        if (searchInput) searchInput.value = "";
        if (clearSearch) clearSearch.style.display = "none";
    }

    applyFilters();
}

function updateFilterCounts() {
    // Count active filters (excluding defaults)
    let activeCount = 0;
    if (filterState.category !== "all") activeCount++;
    if (filterState.priceRange !== "all") activeCount++;
    if (filterState.minRating > 0) activeCount++;
    if (filterState.inStockOnly) activeCount++;
    if (filterState.onSaleOnly) activeCount++;
    if (filterState.search.trim()) activeCount++;

    const mobileBadge = document.getElementById("mobileFilterCount");
    if (mobileBadge) mobileBadge.textContent = activeCount;

    const sidebarApply = document.getElementById("sidebarApplyCount");
    if (sidebarApply) sidebarApply.textContent = filteredProducts.length;
}

/* ================= 6. RENDER PRODUCTS ================= */
function renderProducts() {
    const container = document.getElementById("productcontainer");
    const emptyState = document.getElementById("emptyCatalogState");
    const counter = document.getElementById("productCounter");
    const loadMoreWrap = document.getElementById("loadMoreWrap");
    const remainingEl = document.getElementById("remainingCount");

    if (!container) return;

    const totalMatching = filteredProducts.length;
    const slice = filteredProducts.slice(0, displayedCount);

    if (counter) {
        counter.textContent = `Showing ${slice.length} of ${totalMatching} items`;
    }

    if (totalMatching === 0) {
        container.innerHTML = "";
        if (emptyState) emptyState.style.display = "block";
        if (loadMoreWrap) loadMoreWrap.style.display = "none";
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    container.innerHTML = slice.map((val) => {
        const discountPct = Math.round(val.discountPercentage || 0);
        let originalPrice = "";
        if (discountPct > 5) {
            const oldVal = (val.price / (1 - discountPct / 100)).toFixed(2);
            originalPrice = `$${oldVal}`;
        }

        const rating = Number(val.rating || 0).toFixed(1);
        const reviewCount = (val.reviews && val.reviews.length) 
            ? val.reviews.length * 28 
            : Math.floor((val.rating || 4) * 22);

        const isLowStock = val.stock < 10;
        const stockClass = isLowStock ? "card-stock low-stock" : "card-stock";
        const stockText = isLowStock ? `Only ${val.stock} left in stock!` : `In Stock`;

        const isWishlisted = wishlist.includes(val.id);
        const wishlistClass = isWishlisted ? "card-wishlist-btn active" : "card-wishlist-btn";
        const heartIcon = isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart";

        return `
            <div class="product-card" data-id="${val.id}">
                <div class="card-media-box" onclick="goToDetails(${val.id})">
                    ${discountPct > 5 ? `<span class="card-discount-badge">-${discountPct}%</span>` : ""}
                    
                    <button class="${wishlistClass}" 
                            title="Save to favorites" 
                            onclick="event.stopPropagation(); toggleWishlist(${val.id}, '${escapeQuotes(val.title)}', '${val.thumbnail}')">
                        <i class="${heartIcon}"></i>
                    </button>

                    <img src="${val.thumbnail}" 
                         alt="${val.title}" 
                         loading="lazy" 
                         onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80'">
                </div>

                <div class="card-body">
                    <div class="card-meta-row">
                        <span class="card-category">${formatCategoryName(val.category || "General")}</span>
                        ${val.brand ? `<span class="card-brand">${val.brand}</span>` : ""}
                    </div>

                    <h3 class="card-title" onclick="goToDetails(${val.id})" title="${val.title}">
                        ${val.title}
                    </h3>

                    <div class="card-rating-row">
                        <span class="rating-stars">${getStarRatingMarkup(val.rating)}</span>
                        <span class="rating-score">${rating}</span>
                        <span class="rating-count">(${reviewCount})</span>
                    </div>

                    <div class="card-price-row">
                        <span class="card-price">$${Number(val.price).toFixed(2)}</span>
                        ${originalPrice ? `<span class="card-price-old">${originalPrice}</span>` : ""}
                        ${discountPct > 5 ? `<span class="card-discount-tag">Save ${discountPct}%</span>` : ""}
                    </div>

                    <div class="${stockClass}">
                        <span class="stock-dot"></span>
                        <span>${stockText}</span>
                    </div>

                    <div class="card-actions">
                        <button class="btn-card-cart" onclick="quickAddToCart(${val.id})">
                            <i class="fa-solid fa-cart-plus"></i> Add to Cart
                        </button>
                        <button class="btn-card-quick" onclick="openQuickView(${val.id})">
                            Quick View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    // Load more pagination visibility
    if (loadMoreWrap && remainingEl) {
        const remaining = totalMatching - slice.length;
        if (remaining > 0) {
            loadMoreWrap.style.display = "block";
            remainingEl.textContent = remaining;
        } else {
            loadMoreWrap.style.display = "none";
        }
    }
}

function loadMoreProducts() {
    displayedCount += 12;
    renderProducts();
}

/* ================= 7. MOBILE FILTER DRAWER TOGGLE ================= */
function toggleMobileFilterDrawer() {
    const sidebar = document.getElementById("catalogSidebar");
    const backdrop = document.getElementById("filterDrawerBackdrop");
    if (!sidebar) return;

    const isActive = sidebar.classList.toggle("active");
    if (backdrop) backdrop.classList.toggle("active", isActive);

    document.body.style.overflow = isActive ? "hidden" : "";
}

// Mobile header drawer toggle fallback
function toggleMobileDrawer() {
    const drawer = document.getElementById("mobileDrawer");
    if (drawer) {
        drawer.classList.toggle("active");
        document.body.style.overflow = drawer.classList.contains("active") ? "hidden" : "";
    }
}
window.toggleMobileDrawer = toggleMobileDrawer;

/* ================= 8. LIVE SEARCH AUTOCOMPLETE ================= */
function initLiveSearch() {
    const input = document.getElementById("searchproduct");
    const dropdown = document.getElementById("searchDropdown");
    const clearBtn = document.getElementById("clearSearchBtn");

    if (!input || !dropdown) return;

    input.addEventListener("input", (e) => {
        const val = e.target.value.trim().toLowerCase();
        filterState.search = val;

        if (clearBtn) clearBtn.style.display = val ? "block" : "none";

        if (val.length < 2) {
            dropdown.style.display = "none";
            applyFilters();
            return;
        }

        const matches = allProducts.filter((p) => {
            return (p.title || "").toLowerCase().includes(val) ||
                   (p.category || "").toLowerCase().includes(val) ||
                   (p.brand || "").toLowerCase().includes(val);
        }).slice(0, 5);

        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(p => `
                <div class="search-item-result" onclick="goToDetails(${p.id})">
                    <img src="${p.thumbnail}" alt="${p.title}" onerror="this.style.display='none'">
                    <div class="search-item-info">
                        <div class="search-item-title">${p.title}</div>
                        <div class="search-item-meta">${formatCategoryName(p.category)} • In Stock</div>
                    </div>
                    <div class="search-item-price">$${Number(p.price).toFixed(2)}</div>
                </div>
            `).join("");
            dropdown.style.display = "block";
        } else {
            dropdown.style.display = "none";
        }

        applyFilters();
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".header-search-container")) {
            dropdown.style.display = "none";
        }
    });

    // Clear search button
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            input.value = "";
            filterState.search = "";
            clearBtn.style.display = "none";
            dropdown.style.display = "none";
            applyFilters();
        });
    }
}

/* ================= 9. QUICK VIEW MODAL ================= */
function openQuickView(productId) {
    const prod = allProducts.find((p) => p.id == productId);
    if (!prod) return;

    const modal = document.getElementById("quickViewModal");
    const content = document.getElementById("quickViewContent");
    if (!modal || !content) return;

    const discountPct = Math.round(prod.discountPercentage || 0);

    content.innerHTML = `
        <div class="qv-image-box">
            <img src="${prod.images && prod.images[0] ? prod.images[0] : prod.thumbnail}" 
                 alt="${prod.title}" 
                 onerror="this.src='${prod.thumbnail}'">
        </div>
        <div class="qv-info">
            <span class="category-tag">${formatCategoryName(prod.category)}</span>
            <h2>${prod.title}</h2>
            <div class="card-rating-row">
                <span class="rating-stars">${getStarRatingMarkup(prod.rating)}</span>
                <span class="rating-score">${Number(prod.rating).toFixed(1)} / 5</span>
            </div>
            <div class="qv-price-row">
                <span class="price-main">$${Number(prod.price).toFixed(2)}</span>
                ${discountPct > 5 ? `<span class="card-discount-tag">Save ${discountPct}%</span>` : ""}
            </div>
            <p class="qv-desc">${prod.description}</p>
            <div class="qv-actions">
                <button class="btn btn-primary" onclick="quickAddToCart(${prod.id}); closeQuickViewModal();">
                    <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                </button>
                <button class="btn btn-secondary" onclick="goToDetails(${prod.id})">
                    View Full Details
                </button>
            </div>
        </div>
    `;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeQuickViewModal() {
    const modal = document.getElementById("quickViewModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

/* ================= 10. WISHLIST MODAL ================= */
function openWishlistDrawer() {
    const modal = document.getElementById("wishlistModal");
    const container = document.getElementById("wishlistItemsContainer");
    if (!modal || !container) return;

    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    if (wishlist.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:44px 20px;color:var(--slate-500);">
                <i class="fa-regular fa-heart" style="font-size:36px;margin-bottom:12px;color:var(--slate-300);"></i>
                <h4 style="color:var(--slate-800);margin-bottom:4px;">No saved items yet</h4>
                <p>Click the heart icon on any product to save it to your personal wishlist.</p>
            </div>
        `;
    } else {
        const savedProds = allProducts.filter((p) => wishlist.includes(p.id));
        container.innerHTML = savedProds.map(p => `
            <div class="wishlist-item-row">
                <img src="${p.thumbnail}" alt="${p.title}" onerror="this.style.display='none'">
                <div class="wishlist-item-info">
                    <div class="wishlist-item-title">${p.title}</div>
                    <div class="wishlist-item-price">$${Number(p.price).toFixed(2)}</div>
                </div>
                <button class="btn btn-primary" style="padding:7px 14px;font-size:12px;" onclick="quickAddToCart(${p.id}); closeWishlistModal();">
                    Move to Cart
                </button>
            </div>
        `).join("");
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeWishlistModal() {
    const modal = document.getElementById("wishlistModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

/* ================= 11. NAVIGATION & HELPER UTILITIES ================= */
function goToDetails(productId) {
    localStorage.setItem("pid", productId);
    window.location.href = "../details/details.html";
}

function quickAddToCart(productId) {
    const prod = allProducts.find((p) => p.id == productId);
    if (prod && typeof addToCartGlobal === "function") {
        addToCartGlobal(prod, 1, true);
    }
}

function toggleWishlist(productId, title, image) {
    if (typeof toggleWishlistGlobal === "function") {
        const added = toggleWishlistGlobal(productId, title, image);
        const cardBtn = document.querySelector(`.product-card[data-id="${productId}"] .card-wishlist-btn`);
        if (cardBtn) {
            if (added) {
                cardBtn.classList.add("active");
                cardBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
            } else {
                cardBtn.classList.remove("active");
                cardBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
            }
        }
    }
}

function getStarRatingMarkup(rating) {
    const r = Number(rating) || 0;
    const fullStars = Math.floor(r);
    const hasHalf = (r - fullStars) >= 0.4;
    let stars = "";

    for (let i = 0; i < fullStars && i < 5; i++) {
        stars += `<i class="fa-solid fa-star"></i>`;
    }
    if (hasHalf && fullStars < 5) {
        stars += `<i class="fa-solid fa-star-half-stroke"></i>`;
    }
    const emptyCount = 5 - Math.ceil(r);
    for (let i = 0; i < emptyCount; i++) {
        stars += `<i class="fa-regular fa-star"></i>`;
    }
    return stars;
}

function escapeQuotes(str) {
    return (str || "").replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function setupGlobalShortcuts() {
    // ESC key closes any open modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeQuickViewModal();
            closeWishlistModal();
            const sidebar = document.getElementById("catalogSidebar");
            if (sidebar && sidebar.classList.contains("active")) {
                toggleMobileFilterDrawer();
            }
        }
    });
}