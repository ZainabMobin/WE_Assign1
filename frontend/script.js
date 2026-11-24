
// Load equipment data and cart from localStorage
let currentUserID = null;
let currentUserEmail = '';
let csrfToken = '';
let cart = [];

const IMAGE_ENDPOINT = '../backend/api/image.php';
const FALLBACK_IMG_SRC = 'assets/img/fallback.jpg';
let equipmentData = [];

// placeholder for filters
let filters = "";


/**
 * 
 * populate product catalogue
 */
async function initializeCatalogue() {

    const gridContainer = document.querySelector('.product-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    const fetchedProducts = await fetchFilteredProducts(filters);
    equipmentData = Array.isArray(fetchedProducts) ? fetchedProducts : [];
    
    equipmentData.forEach(item => {
        const isAvailable = item.amount_stock > 0;

        const badgeList = document.createElement('div');
        badgeList.classList.add('prod-badges');

        if (Array.isArray(item.categories)) {
            item.categories.forEach(cat => {
                const badge = document.createElement('span');
                badge.classList.add('badge', 'badge-cat');
                badge.textContent = cat;
                badgeList.appendChild(badge);
            });
        }

        // Supports either a single colour string or an array of colours
        const colours = Array.isArray(item.colours) ? item.colours : 
                ( item.colours && item.colours.toLowerCase() !== 'none' ? [item.colours] : [] );

        colours.forEach(col => {
            if (col && String(col).toLowerCase() !== 'none') {
                const badge = document.createElement('span');
                badge.classList.add('badge', 'badge-color');
                badge.textContent = col;
                badgeList.appendChild(badge);
            }
        });


        // cell for each product
        const cell = document.createElement('div');
        cell.className = 'product-cell';
        if (!isAvailable) cell.classList.add('disable');


        // box to hold prod image
        const prodImgBox = document.createElement('div');
        prodImgBox.classList.add('prod-img-box');
        const img = document.createElement('img');
       
        fetchProductImageSrc(item.prod_id).
            then((resolvedSrc) => {
                console.log(`Frontend got ${resolvedSrc} for ID: ${item.prod_id}`)
                img.src = resolvedSrc; 
        });

        img.alt = item.name;
        prodImgBox.appendChild(img);


        //prodInfo with name, desc and badges
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


        // holds availability status 
        const prodStatus = document.createElement('div');
        prodStatus.classList.add('prod-status', isAvailable ? 'status-available' : 'status-unavailable');

        const statusDot = document.createElement('span');
        statusDot.classList.add('status-dot');

        const statusText = document.createElement('span');
        statusText.classList.add('status-text');
        statusText.textContent = isAvailable ? `${item.amount_stock} in stock` : 'Out of stock';

        prodStatus.appendChild(statusDot);
        prodStatus.appendChild(statusText);


        // add to cart button
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

    // Add to Cart event listeners
    document.querySelectorAll('.prod-action-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const prod_id = e.target.getAttribute('data-id');
            const product = equipmentData.find(p => String(p.prod_id) === String(prod_id));

            if (!product) return;

            const existing = cart.find(item => String(item.prod_id) === String(prod_id));
            if (existing) {
                if (existing.quantity < product.amount_stock) {
                    existing.quantity += 1;
                    alert('Item quantity updated in cart!');
                } else {
                    alert('Cannot add more than available stock.');
                }
            } else {
                cart.push({ prod_id: product.prod_id, quantity: 1 });
                alert('Item added to cart!');
            }

            localStorage.setItem('gearRigCart', JSON.stringify(cart));
        });
    });
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

function attachCartActionListeners() {
    document.querySelectorAll('.qty-inc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = cart.find(i => String(i.prod_id ?? i.prodId) === String(id));
            const product = equipmentData.find(eq => String(eq.prod_id) === String(id));

            if (item && product && item.quantity < product.amount_stock) {
                item.quantity += 1;
                initializeCart();
            }
        });
    });

    document.querySelectorAll('.qty-dec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = cart.find(i => String(i.prod_id ?? i.prodId) === String(id));
            if (item && item.quantity > 1) {
                item.quantity -= 1;
                initializeCart();
            }
        });
    });

    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            cart = cart.filter(i => String(i.prod_id ?? i.prodId) !== String(id));
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

    freshForm.addEventListener('submit', (e) => {
        e.preventDefault();

        syncSessionStateFromStorage();
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

        cart.forEach(cartItem => {
            const itemId = cartItem.prod_id ?? cartItem.prodId;
            const product = equipmentData.find(p => String(p.prod_id) === String(itemId));
            if (product) {
                product.amount_stock = Math.max(0, product.amount_stock - cartItem.quantity);
            }
        });

        cart = [];
        alert('Checkout successful! Inventory updated and cart reset.');
        initializeCart();
        freshForm.reset();
        lockBorrowEmailInput();
    });
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
    const loginBtn = document.getElementById('login-submit-btn');
    if (!loginBtn) return;

    loginBtn.addEventListener('click', async (e) => {
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
            const res = await fetchAuthStatus(email, password);

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
    });
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
    ? `../backend/api/products.php?${query}`
    : '../backend/api/products.php';

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
        const url = `${IMAGE_ENDPOINT}?prodId=${encodeURIComponent(String(prodId ?? ''))}`;
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
async function fetchAuthStatus(email, password){

    const url = '../backend/api/login.php';

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