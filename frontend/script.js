let currentUserID = null;
let currentUserEmail = '';
let csrfToken = '';
let cart = [];

const CART_SESSION_KEY = 'gearRigSessionCart';
const IMAGE_API_URL = '../backend/api/image.php'; 
const LOGIN_API_URL = '../backend/api/login.php';
const PRODUCTS_API_URL = '../backend/api/products.php';
const CHECKOUT_API_URL = '../backend/api/checkout.php';
const FALLBACK_IMG_SRC = 'assets/img/fallback.jpg';

// placeholder for filters
let filters = "";

let allCatalogueProducts = []; // Full in-memory product list from initial load
let equipmentData = [];        // Currently displayed products
let availableCategories = [];
let availableColours = [];

// Stores only raw strings like 'Electronics', 'Misc', 'Red', 'None'
const activeFilters = {
    name: '',
    categories: [],
    colours: [],
};

async function fetchFilterMetadata() {
    const res = await fetch(`${PRODUCTS_API_URL}?meta=filters`, {
        headers: { Accept: 'application/json' },
    });
    const data = await res.json();

    const cats = Array.isArray(data?.categories) ? data.categories : [];
    const cols = Array.isArray(data?.colours) ? data.colours : [];

    availableCategories = cats.includes('Misc') ? [...cats] : [...cats, 'Misc'];
    availableColours = cols.includes('None') ? [...cols] : [...cols, 'None'];
}

async function fetchProductsByName(nameQuery) {
    const params = new URLSearchParams();
    if (nameQuery.trim() !== '') {
        params.set('name', nameQuery.trim());
    }
    const qs = params.toString();
    const url = qs ? `${PRODUCTS_API_URL}?${qs}` : PRODUCTS_API_URL;

    const res = await fetch(url, {
        headers: { Accept: 'application/json' },
    });
    const data = await res.json();
    return Array.isArray(data?.products) ? data.products : [];
}

function populateFilterDropdowns() {
    const holders = document.querySelectorAll('.component-filter');

    holders.forEach((filterBox) => {
        const type = filterBox.dataset.filterType;
        const unitHolder = filterBox.querySelector('.filter-unit-holder');
        if (!unitHolder) return;

        unitHolder.innerHTML = '';
        const list = type === 'category' ? availableCategories : availableColours;

        list.forEach((rawValue) => {
            const unit = document.createElement('div');
            unit.className = 'filter-unit';
            unit.dataset.value = rawValue;
            unit.textContent = rawValue;

            // Toggle string in activeFilters on click
            unit.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFilterValue(type, rawValue);
            });

            unitHolder.appendChild(unit);
        });
    });
}

function syncSelectedUnitClasses() {
    document.querySelectorAll('.component-filter').forEach((filterBox) => {
        const type = filterBox.dataset.filterType;
        const selectedList = type === 'category' ? activeFilters.categories : activeFilters.colours;

        filterBox.querySelectorAll('.filter-unit').forEach((unit) => {
            const val = unit.dataset.value;
            unit.classList.toggle('is-selected', selectedList.includes(val));
        });
    });
}

// Render applied-filters when called after a filter state change
function renderAppliedFilters() {
    const wrapper = document.querySelector('.filter-wrapper');
    const appliedContainer = document.querySelector('.applied-filter');
    if (!appliedContainer) return;

    appliedContainer.innerHTML = '';

    const entries = [
        ...activeFilters.categories.map((val) => ({ type: 'category', value: val })),
        ...activeFilters.colours.map((val) => ({ type: 'colour', value: val })),
    ];

    entries.forEach(({ type, value }) => {
        const badge = document.createElement('div');
        badge.className = 'filter-badge';
        badge.dataset.filterType = type;
        badge.dataset.value = value;

        const label = document.createElement('div');
        label.className = 'filter-value';
        label.textContent = value; // Pure string: 'Electronics', 'Red', etc.

        const cross = document.createElement('div');
        cross.className = 'filter-cross';
        cross.textContent = '×';
        cross.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFilterValue(type, value);
        });

        badge.appendChild(label);
        badge.appendChild(cross);
        appliedContainer.appendChild(badge);
    });

    if (wrapper) {
        const hasAny =
            activeFilters.categories.length > 0 ||
            activeFilters.colours.length > 0 ||
            activeFilters.name.trim() !== '';
        wrapper.classList.toggle('has-active-filters', hasAny);
    }

    syncSelectedUnitClasses();
}

function matchesInMemoryFilters(product) {
    const prodCats = Array.isArray(product.categories) ? product.categories : [];
    const prodCols = Array.isArray(product.colours) ? product.colours : [];

    if (activeFilters.categories.length > 0) {
        const catMatch = activeFilters.categories.some((selectedCat) => {
            if (selectedCat.toLowerCase() === 'misc') {
                return prodCats.length === 0;
            }
            return prodCats.some((c) => c.toLowerCase() === selectedCat.toLowerCase());
        });
        if (!catMatch) return false;
    }

    if (activeFilters.colours.length > 0) {
        const colMatch = activeFilters.colours.some((selectedCol) => {
            if (selectedCol.toLowerCase() === 'none') {
                return prodCols.length === 0;
            }
            return prodCols.some((c) => c.toLowerCase() === selectedCol.toLowerCase());
        });
        if (!colMatch) return false;
    }

    return true;
}

// Only call backend when name is searched
//  otherwis filter cached in-memory product list
async function applyFiltersAndRenderCatalogue() {
    const trimmedName = activeFilters.name.trim();
    const sourceList = trimmedName !== ''
        ? await fetchProductsByName(trimmedName)
        : allCatalogueProducts;

    const filteredList = sourceList.filter(matchesInMemoryFilters);
    renderProductGrid(filteredList);
}

function toggleFilterValue(type, rawValue) {
    const list = type === 'category' ? activeFilters.categories : activeFilters.colours;
    const idx = list.indexOf(rawValue);

    if (idx >= 0) {
        list.splice(idx, 1);
    } else {
        list.push(rawValue);
    }

    renderAppliedFilters();
    applyFiltersAndRenderCatalogue();
}

function removeFilterValue(type, rawValue) {
    const list = type === 'category' ? activeFilters.categories : activeFilters.colours;
    const idx = list.indexOf(rawValue);
    if (idx === -1) return;

    list.splice(idx, 1);
    renderAppliedFilters();
    applyFiltersAndRenderCatalogue();
}

function clearAllFilters() {
    const hadFilters =
        activeFilters.categories.length > 0 ||
        activeFilters.colours.length > 0 ||
        activeFilters.name.trim() !== '';

    activeFilters.categories.length = 0;
    activeFilters.colours.length = 0;
    activeFilters.name = '';

    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.value = '';
    }

    if (!hadFilters) return;

    renderAppliedFilters();
    applyFiltersAndRenderCatalogue();
}

function setupFilterEvents() {
    const searchInput = document.querySelector('.search-bar input');
    const clearBtn = document.querySelector('.clear-filter');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            activeFilters.name = e.target.value;
            const wrapper = document.querySelector('.filter-wrapper');
            if (wrapper) {
                const hasAny =
                    activeFilters.categories.length > 0 ||
                    activeFilters.colours.length > 0 ||
                    activeFilters.name.trim() !== '';
                wrapper.classList.toggle('has-active-filters', hasAny);
            }
            applyFiltersAndRenderCatalogue();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearAllFilters();
        });
    }
}

function renderProductGrid(productsToRender) {
    const gridContainer = document.querySelector('.product-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    equipmentData = Array.isArray(productsToRender) ? productsToRender : [];

    equipmentData.forEach((item) => {
        const isAvailable = item.amount_stock > 0;

        const badgeList = document.createElement('div');
        badgeList.classList.add('prod-badges');

        if (Array.isArray(item.categories)) {
            item.categories.forEach((cat) => {
                const badge = document.createElement('span');
                badge.classList.add('badge', 'badge-cat');
                badge.textContent = cat;
                badgeList.appendChild(badge);
            });
        }

        const colours = Array.isArray(item.colours)
            ? item.colours : (item.colours && item.colours.toLowerCase() !== 'none' ? [item.colours] : []);

        colours.forEach((col) => {
            if (col && String(col).toLowerCase() !== 'none') {
                const badge = document.createElement('span');
                badge.classList.add('badge', 'badge-color');
                badge.textContent = col;
                badgeList.appendChild(badge);
            }
        });

        const cell = document.createElement('div');
        cell.className = 'product-cell';
        if (!isAvailable) cell.classList.add('disable');

        const prodImgBox = document.createElement('div');
        prodImgBox.classList.add('prod-img-box');
        const img = document.createElement('img');

        fetchProductImageSrc(item.prod_id).then((resolvedSrc) => {
            img.src = resolvedSrc;
        });

        img.alt = item.name;
        prodImgBox.appendChild(img);

        const prodInfo = document.createElement('div');
        prodInfo.classList.add('prod-info');

        const prodName = document.createElement('h3');
        prodName.classList.add('prod-name');
        prodName.textContent = item.name;

        const prodDesc = document.createElement('p');
        prodDesc.classList.add('prod-desc');
        prodDesc.textContent = item.description;

        prodInfo.appendChild(prodName);
        prodInfo.appendChild(prodDesc);
        prodInfo.appendChild(badgeList);

        const prodStatus = document.createElement('div');
        prodStatus.classList.add('prod-status', isAvailable ? 'status-available' : 'status-unavailable');

        const statusDot = document.createElement('span');
        statusDot.classList.add('status-dot');

        const statusText = document.createElement('span');
        statusText.classList.add('status-text');
        statusText.textContent = isAvailable ? `${item.amount_stock} in stock` : 'Out of stock';

        prodStatus.appendChild(statusDot);
        prodStatus.appendChild(statusText);

        const prodActionBtn = document.createElement('button');
        prodActionBtn.classList.add('prod-action-btn');
        prodActionBtn.dataset.id = item.prod_id;
        prodActionBtn.disabled = !isAvailable;
        prodActionBtn.textContent = isAvailable ? 'Add to Cart' : 'Unavailable';

        cell.appendChild(prodImgBox);
        cell.appendChild(prodInfo);
        cell.appendChild(prodStatus);
        cell.appendChild(prodActionBtn);

        gridContainer.appendChild(cell);
    });

    document.querySelectorAll('.prod-action-btn').forEach((button) => {
        button.addEventListener('click', (e) => {
            const prod_id = e.target.getAttribute('data-id');
            const product = equipmentData.find((p) => String(p.prod_id) === String(prod_id));
            if (!product) return;

            const existing = cart.find((item) => String(item.prod_id ?? item.prodId) === String(prod_id));
            if (existing) {
                if (existing.quantity < product.amount_stock) {
                    existing.quantity += 1;
                    alert('Item quantity updated in cart!');
                } else {
                    alert('Cannot add more than available stock.');
                }
            } else {
                cart.push({ prod_id: product.prod_id, quantity: 1 });
                saveCartToSession(cart);
                alert('Item added to cart!');
            }
        });
    });
}

async function initializeCatalogue() {
    const gridContainer = document.querySelector('.product-grid');
    if (!gridContainer) return;

    await fetchFilterMetadata();
    populateFilterDropdowns();
    setupFilterEvents();

    allCatalogueProducts = await fetchProductsByName('');
    renderAppliedFilters();
    renderProductGrid(allCatalogueProducts);
}

// should fetch data from databse upon reresh
async function initializeCart() {
    lockBorrowEmailInput();

    
    const cartGrid = document.querySelector('.cart-grid');
    if (!cartGrid) return;
    
    cartGrid.innerHTML = '';
    
    if (currentUserID === null) {
        const emptyMsg = document.createElement('div');
        emptyMsg.classList.add('empty-cart');
        emptyMsg.textContent = 'Sign in to add items to your cart';
        cartGrid.appendChild(emptyMsg);
        
        const borrowEmail = document.getElementById('borrow-email');
        if (!borrowEmail) return;
        
        borrowEmail.readOnly = true;
        borrowEmail.disabled = true;
        borrowEmail.classList.add('disabled');
        
        setupCheckoutHandler();
        return;
    }
    
    const returnDateInput = document.getElementById('return-date');
    if (returnDateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        returnDateInput.min = `${yyyy}-${mm}-${dd}`;

        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 4);
        const maxYyyy = maxDate.getFullYear();
        const maxMm = String(maxDate.getMonth() + 1).padStart(2, '0');
        const maxDd = String(maxDate.getDate()).padStart(2, '0');
        returnDateInput.max = `${maxYyyy}-${maxMm}-${maxDd}`;
    }

    if (cart.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.classList.add('empty-cart');
        emptyMsg.textContent = 'Your cart is empty. Browse the Catalogue to add gear.';
        cartGrid.appendChild(emptyMsg);
        setupCheckoutHandler();
        return;
    }

    if (equipmentData.length === 0) {
        const fetchedProducts = await fetchFilteredProducts(filters);
        equipmentData = Array.isArray(fetchedProducts) ? fetchedProducts : [];
    }

    cart.forEach(cartItem => {
        const itemId = cartItem.prod_id ?? cartItem.prodId;
        const product = equipmentData.find(eq => String(eq.prod_id) === String(itemId));
        if (!product) return;

        const isMaxStock = cartItem.quantity >= product.amount_stock;

        const cartCell = document.createElement('div');
        cartCell.className = 'cart-cell-item';

        const cartItemImgBox = document.createElement('div');
        cartItemImgBox.classList.add('cart-item-img-box');

        const cartItemImg = document.createElement('img');
        cartItemImg.src = FALLBACK_IMG_SRC;
        fetchProductImageSrc(product.prod_id).then((resolvedSrc) => {
            cartItemImg.src = resolvedSrc;
        });
        cartItemImg.alt = product.name;
        cartItemImgBox.appendChild(cartItemImg);

        const cartItemInfo = document.createElement('div');
        cartItemInfo.classList.add('cart-item-info');

        const cartItemName = document.createElement('h3');
        cartItemName.classList.add('cart-item-name');
        cartItemName.textContent = product.name;

        const cartItemDesc = document.createElement('span');
        cartItemDesc.classList.add('cart-item-spec');
        cartItemDesc.textContent = product.description;

        cartItemInfo.appendChild(cartItemName);
        cartItemInfo.appendChild(cartItemDesc);

        const cartItemControl = document.createElement('div');
        cartItemControl.classList.add('cart-item-controls');

        const minusBtn = document.createElement('button');
        minusBtn.classList.add('qty-btn', 'qty-dec');
        minusBtn.dataset.id = product.prod_id;
        minusBtn.textContent = '-';

        const amountDisplay = document.createElement('span');
        amountDisplay.classList.add('qty-display');
        amountDisplay.textContent = cartItem.quantity;

        const plusBtn = document.createElement('button');
        plusBtn.classList.add('qty-btn', 'qty-inc');
        plusBtn.dataset.id = product.prod_id;
        plusBtn.textContent = '+';

        if (isMaxStock) {
            plusBtn.disabled = true;
            plusBtn.style.opacity = '0.4';
            plusBtn.style.cursor = 'not-allowed';
        }

        cartItemControl.appendChild(minusBtn);
        cartItemControl.appendChild(amountDisplay);
        cartItemControl.appendChild(plusBtn);

        const cartRemoveBtn = document.createElement('button');
        cartRemoveBtn.classList.add('cart-remove-btn');
        cartRemoveBtn.dataset.id = product.prod_id;
        cartRemoveBtn.textContent = '×';

        cartCell.appendChild(cartItemImgBox);
        cartCell.appendChild(cartItemInfo);
        cartCell.appendChild(cartItemControl);
        cartCell.appendChild(cartRemoveBtn);

        cartGrid.appendChild(cartCell);
    });

    attachCartActionListeners();
    setupCheckoutHandler();
}

// refresh only the numbered values in the cart items and not the whole UI (bug re-rerenders with image fetch again and again) 
function refreshCartItemUI(prodId, cartItem, product) {
    const btn = document.querySelector(`.qty-inc[data-id="${prodId}"]`);
    const cell = btn ? btn.closest('.cart-cell-item') : null;
    if (!cell) {
        initializeCart();
        return;
    }

    const amountDisplay = cell.querySelector('.qty-display');
    const plusBtn = cell.querySelector('.qty-inc');
    const isMaxStock = cartItem.quantity >= product.amount_stock;

    if (amountDisplay) {
        amountDisplay.textContent = String(cartItem.quantity);
    }

    if (plusBtn) {
        plusBtn.disabled = isMaxStock;
        plusBtn.style.opacity = isMaxStock ? '0.4' : '';
        plusBtn.style.cursor = isMaxStock ? 'not-allowed' : '';
    }
}

function attachCartActionListeners() {
    document.querySelectorAll('.qty-inc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = cart.find(i => String(i.prod_id ?? i.prodId) === String(id));
            const product = equipmentData.find(eq => String(eq.prod_id) === String(id));

            if (item && product && item.quantity < product.amount_stock) {
                item.quantity += 1;
                saveCartToSession();
                refreshCartItemUI(id, item, product);
            }
        });
    });

    document.querySelectorAll('.qty-dec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = cart.find(i => String(i.prod_id ?? i.prodId) === String(id));
            const product = equipmentData.find(eq => String(eq.prod_id) === String(id));

            if (item && product && item.quantity > 1) {
                item.quantity -= 1;
                saveCartToSession();
                refreshCartItemUI(id, item, product);
            }
        });
    });

    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            cart = cart.filter(i => String(i.prod_id ?? i.prodId) !== String(id));
            saveCartToSession();
            initializeCart();
        });
    });
}

function setupCheckoutHandler() {
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    const freshForm = checkoutForm.cloneNode(true);
    checkoutForm.replaceWith(freshForm);
    lockBorrowEmailInput();

    freshForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        syncSessionStateFromStorage();
        loadCartFromSession();

        if (currentUserID === null) {
            alert('Please sign in before submitting an order.');
            return;
        }

        const emailField = document.getElementById('borrow-email');
        const emailInput = (currentUserEmail || (emailField ? emailField.value.trim() : '')).toLowerCase();

        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        if (!emailInput.endsWith('@nust.edu.pk')) {
            alert('Checkout requires a valid university email ending with @nust.edu.pk');
            return;
        }

        const returnDateInput = document.getElementById('return-date');
        const returnDate = returnDateInput ? returnDateInput.value : '';

        const submitBtn = freshForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const { status, data } = await postCheckout(currentUserID, cart, returnDate);

            if (status === 409 || data?.stock_exceeded) {
                // Dont reset cart so user can adjust quantities
                alert(data?.error || 'Requested amount exceeds available stock.');
                return;
            }

            if (!data || !data.ok) {
                alert(data?.error || 'Could not complete checkout.');
                return;
            }

            // Order succeeded: clear cart and reset form
            cart = [];
            sessionStorage.removeItem(CART_SESSION_KEY);
            equipmentData = [];
            alert('Checkout successful! Order submitted.');
            await initializeCart();
            freshForm.reset();
            lockBorrowEmailInput();
        } catch (err) {
            console.error('Checkout error:', err.message, ' ', err.status);
            alert('Network or server error during checkout.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

/**
 * load cart stored in sessionStorage per session key
 */
function loadCartFromSession() {
    try {
        const raw = sessionStorage.getItem(CART_SESSION_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        cart = Array.isArray(parsed) ? parsed : [];
    } catch {
        cart = [];
    }
}

/**
 * save current cart to session storage
 */
function saveCartToSession(){
    sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(cart));
}

function syncSessionStateFromStorage() {
    if (!currentUserEmail) {
        currentUserEmail = sessionStorage.getItem('gearRigAuthEmail') || '';
    }
    if (currentUserID === null) {
        const storedId = sessionStorage.getItem('gearRigAuthUserId');
        if (storedId) {
            currentUserID = Number(storedId);
        }
    }
    if (!csrfToken) {
        csrfToken = sessionStorage.getItem('gearRigToken') || '';
    }

    console.log('[Session Sync]', {
        currentUserID,
        currentUserEmail,
        csrfToken,
        storageToken: sessionStorage.getItem('gearRigToken'),
    });
}

function setLoginFeedback(message, isError = false) {
    const msgEl = document.getElementById('login-message');
    if (!msgEl) return;
    msgEl.textContent = message;
    msgEl.hidden = !message;
    msgEl.classList.toggle('error', isError);
    msgEl.classList.toggle('success', !isError && Boolean(message));
}

function validateLoginForm(email, password) {
    if (!email) {
        return 'Please enter your university email.';
    }
    if (!/^[^\s@]+@nust\.edu\.pk$/i.test(email)) {
        return 'Please use a valid @nust.edu.pk email address.';
    }
    if (!password) {
        return 'Please enter your password.';
    }
    if (password.length < 6) {
        return 'Password must be at least 6 characters.';
    }
    return '';
}

function setupLoginHandler() {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-submit-btn');
    if (!loginForm || !loginBtn) return;

    const handleLogin = async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');

        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const password = passwordInput ? passwordInput.value : '';

        const validationError = validateLoginForm(email, password);
        if (validationError) {
            setLoginFeedback(validationError, true);
            return;
        }

        loginBtn.disabled = true;
        setLoginFeedback('Signing in...', false);

        try {
            const res = await postAuthInfo(email, password);

            console.log('calling backend for auth verification');

            if (res && res.ok && res.authorized === true) {
                currentUserID = res.user?.user_id ?? null;
                currentUserEmail = res.user?.email ?? email;
                csrfToken = res.csrf_token ?? '';

                sessionStorage.setItem('gearRigAuthEmail', currentUserEmail);
                if (currentUserID !== null) {
                    sessionStorage.setItem('gearRigAuthUserId', String(currentUserID));
                }
                if (csrfToken) {
                    sessionStorage.setItem('gearRigToken', String(csrfToken));
                }

                console.log('[CSRF Login] received token:', res.csrf_token, 
                    'stored in sessionStorage:', sessionStorage.getItem('gearRigToken'));

                window.location.href = './cart.html';
                return;
            }

            setLoginFeedback(res?.error || 'Invalid email or password.', true);
        } catch (err) {
            console.error('Login failed:', err);
            setLoginFeedback('Could not connect to authentication endpoint.', true);
        } finally {
            loginBtn.disabled = false;
        }
    };

    if (loginForm){
        loginForm.addEventListener('submit', handleLogin);
    } else if (loginBtn){
        loginBtn.addEventListener('click', handleLogin);
    }
}

// locks borrow email inout field on checkout
function lockBorrowEmailInput() {
    syncSessionStateFromStorage();
    const borrowEmail = document.getElementById('borrow-email');
    if (!borrowEmail) return;

    if (currentUserEmail) {
        borrowEmail.value = currentUserEmail;
        borrowEmail.readOnly = true;
        borrowEmail.disabled = true;
        borrowEmail.classList.add('disabled');
    } else {
        borrowEmail.value = '';
        borrowEmail.readOnly = false;
        borrowEmail.disabled = false;
        borrowEmail.classList.remove('disabled');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    syncSessionStateFromStorage();
    loadCartFromSession();
    setupLoginHandler();
});

/**
 * 
 * returns products fetched from backend based on given filters
 * @params name, color and categories: optional list of strings.
 *      if empty then fetch all products  
 * @returns products fetched from backend
 */
async function fetchFilteredProducts({ name = '', colour = '', category = '' } = {}) {
    const params = new URLSearchParams();

    if (name.trim() !== '') params.set('name', name.trim());
    if (colour.trim() !== '') params.set('colour', colour.trim());
    if (category.trim() !== '') params.set('category', category.trim());

    const query = params.toString();
    const url = query
    ? `${PRODUCTS_API_URL}?${query}` : PRODUCTS_API_URL;

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Failed to load products');
    }

    return data.products;
}

// get valid product image path string from php endpoint,  
async function fetchProductImageSrc(prodId) {
    try {
        const url = `${IMAGE_API_URL}?prodId=${encodeURIComponent(String(prodId ?? ''))}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();

        if (!res.ok || !data.ok || typeof data.src !== 'string') {
            return FALLBACK_IMG_SRC;
        }
        return data.src;
    } catch (err) {
        console.error('Image lookup failed for', prodId, err);
        return FALLBACK_IMG_SRC;
    }
}


/**
 * To check for user authorization
 * @param {String} email 
 * @param {String} password 
 * @returns {Promise} data
 */
async function postAuthInfo(email, password){

    const url = LOGIN_API_URL;

    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            email: email, 
            password: password, 
        }),
    });

    const data = await response.json();
    console.log('got data from backend auth: ', data.error);
    return data;
}

/**
 * 
 * @param {int} userID 
 * @param {JSON Array} items 
 * @param {String} returnDate 
 * @returns 
 */
async function postCheckout(userID, items, returnDate = '') {
    syncSessionStateFromStorage();

    const url = CHECKOUT_API_URL; 
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    // put clientside token in the header
    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }

    console.log('post checkout ::: [Session Sync]', {
        currentUserID,
        currentUserEmail,
        csrfToken,
        storageToken: sessionStorage.getItem('gearRigToken'),
    });

    const bodySent = JSON.stringify({
            user_id: userID,
            items,
            return_date: returnDate,
        });
        
    console.log('BODY SENT', bodySent);


    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify({
            user_id: userID,
            items,
            return_date: returnDate,
        }), 
    });

    const data = await response.json();
    return { status: response.status, ok: response.ok, data };
}