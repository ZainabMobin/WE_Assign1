// fallback if localStorage is empty
const defaultEquipment = [
    {
        prodId: "EQ-001",
        name: "Spotlight",
        desc: "18W golden beam, adjustable mount",
        amountStock: 12,
        colour: "gold",
        categories: ["electronics", "staging"],
    },
    {
        prodId: "EQ-002",
        name: "Flood Light",
        desc: "20W wide-angle LED, IP65 rated",
        amountStock: 0,
        colour: "white",
        categories: ["electronics"],
    },
    {
        prodId: "EQ-003",
        name: "Velvet Carpet",
        desc: "Linen-backed crimson runner, 10m roll",
        amountStock: 6,
        colour: "red",
        categories: ["staging"],
    },
    {
        prodId: "EQ-004",
        name: "Speakers",
        desc: "150dB peak SPL, dual XLR/TRS input",
        amountStock: 4,
        colour: "none",
        categories: ["electronics"],
    },
    {
        prodId: "EQ-005",
        name: "Microphone",
        desc: "-54dBV/Pa sensitivity",
        amountStock: 9,
        colour: "none",
        categories: ["electronics"],
    }
];

// Load equipment data and cart from localStorage
let equipmentData = JSON.parse(localStorage.getItem('gearRigEquipment')) || defaultEquipment;
let cart = JSON.parse(localStorage.getItem('gearRigCart')) || [];

const IMAGE_ENDPOINT = '../backend/api/image.php';
const FALLBACK_IMG_SRC = 'assets/img/fallback.jpg';



// should fetch logged user id specific data when refreshed
function initializeCatalogue() {
    const gridContainer = document.querySelector('.product-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    equipmentData.forEach(item => {
        const isAvailable = item.amountStock > 0;

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
        const colours = Array.isArray(item.colour) ? item.colour : 
                ( item.colour && item.colour.toLowerCase() !== 'none' ? [item.colour] : [] );

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
       
        fetchProductImageSrc(item.prodId).
            then((resolvedSrc) => {
                console.log(`Frontend got ${resolvedSrc} for ID: ${item.prodId}`)
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
        prodDesc.textContent = item.desc;

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
        statusText.textContent = isAvailable ? `${item.amountStock} in stock` : 'Out of stock';

        prodStatus.appendChild(statusDot);
        prodStatus.appendChild(statusText);


        // add to cart button
        const prodActionBtn = document.createElement('button');
        prodActionBtn.classList.add('prod-action-btn');
        prodActionBtn.dataset.id = item.prodId;
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
            const prodId = e.target.getAttribute('data-id');
            const product = equipmentData.find(p => String(p.prodId) === String(prodId));

            if (!product) return;

            const existing = cart.find(item => String(item.prodId) === String(prodId));
            if (existing) {
                if (existing.quantity < product.amountStock) {
                    existing.quantity += 1;
                    alert('Item quantity updated in cart!');
                } else {
                    alert('Cannot add more than available stock.');
                }
            } else {
                cart.push({ prodId: product.prodId, quantity: 1 });
                alert('Item added to cart!');
            }

            localStorage.setItem('gearRigCart', JSON.stringify(cart));
        });
    });
}

// should fetch data from databse upon reresh
function initializeCart() {
    const cartGrid = document.querySelector('.cart-grid');
    if (!cartGrid) return;

    cartGrid.innerHTML = '';

    // Set return date constraints (Today to 4 months max)
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
        return;
    }

    cart.forEach(cartItem => {
        const product = equipmentData.find(eq => String(eq.prodId) === String(cartItem.prodId));
        if (!product) return;

        // Disable '+' button if cart quantity equals or exceeds available stock
        const isMaxStock = cartItem.quantity >= product.amountStock;

        const cartCell = document.createElement('div');
        cartCell.className = 'cart-cell-item';


        // image holder
        const cartItemImgBox = document.createElement('div');
        cartItemImgBox.classList.add('cart-item-img-box');

        const cartItemImg = document.createElement('img');
        fetchProductImageSrc(cartItem.prodId)
            .then((resolvedSrc) => {
                console.log(`Frontend got ${resolvedSrc} for ID: ${cartItem.prodId}`)
                cartItemImg.src = resolvedSrc; 
            });
        cartItemImg.alt = product.name;
        
        cartItemImgBox.appendChild(cartItemImg);


        // info holds name and desc
        const cartItemInfo = document.createElement('div');
        cartItemInfo.classList.add('cart-item-info');

        const cartItemName = document.createElement('h3');
        cartItemName.classList.add('cart-item-name');
        cartItemName.textContent = product.name;

        const cartItemDesc = document.createElement('span');
        cartItemDesc.classList.add('cart-item-spec');
        cartItemDesc.textContent = product.desc;

        cartItemInfo.appendChild(cartItemName);
        cartItemInfo.appendChild(cartItemDesc);


        // controls -, amount and + btns
        const cartItemControl = document.createElement('div');
        cartItemControl.classList.add('cart-item-controls');

        const minusBtn = document.createElement('button');
        minusBtn.classList.add('qty-btn', 'qty-dec');
        minusBtn.dataset.id = product.prodId;
        minusBtn.textContent = '-';

        const amountDisplay = document.createElement('span');
        amountDisplay.classList.add('qty-display');
        amountDisplay.textContent = cartItem.quantity;

        const plusBtn = document.createElement('button');
        plusBtn.classList.add('qty-btn', 'qty-inc');
        plusBtn.dataset.id = product.prodId;
        plusBtn.textContent = '+';

        if (isMaxStock) {
            plusBtn.disabled = true;
            plusBtn.style.opacity = '0.4';
            plusBtn.style.cursor = 'not-allowed';
        }

        cartItemControl.appendChild(minusBtn);
        cartItemControl.appendChild(amountDisplay);
        cartItemControl.appendChild(plusBtn);


        // Remove from cart button
        const cartRemoveBtn = document.createElement('button');
        cartRemoveBtn.classList.add('cart-remove-btn');
        cartRemoveBtn.dataset.id = product.prodId;
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

// Helper to handle quantity updates and item removal in cart view
function attachCartActionListeners() {
    document.querySelectorAll('.qty-inc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const item = cart.find(i => i.prodId === id);
            const product = equipmentData.find(eq => eq.prodId === id);
            
            if (item && product && item.quantity < product.amountStock) {
                item.quantity++;
                localStorage.setItem('gearRigCart', JSON.stringify(cart));
                initializeCart(); // Re-render cart view
            }
        });
    });

    document.querySelectorAll('.qty-dec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const item = cart.find(i => i.prodId === id);
            if (item && item.quantity > 1) {
                item.quantity--;
                localStorage.setItem('gearRigCart', JSON.stringify(cart));
                initializeCart(); // Re-render cart view
            }
        });
    });

    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            cart = cart.filter(i => i.prodId !== id);
            localStorage.setItem('gearRigCart', JSON.stringify(cart));
            initializeCart(); // Re-render cart view
        });
    });
}

// Checkout submission handler: reduces equipment stock & resets cart
function setupCheckoutHandler() {
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    // Remove existing listeners to avoid duplicate bindings if re-initialized
    checkoutForm.replaceWith(checkoutForm.cloneNode(true));
    const freshForm = document.getElementById('checkout-form');

    freshForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('student-email').value.trim();
        
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Validate university domain ending
        if (!emailInput.endsWith('nust.edu.pk')) {
            alert('Checkout requires a valid university email domain ending with nust.edu.pk');
            return;
        }
        
        // Decrease stock counts in equipmentData
        cart.forEach(cartItem => {
            const product = equipmentData.find(p => p.prodId === cartItem.prodId);
            if (product) {
                product.amountStock = Math.max(0, product.amountStock - cartItem.quantity);
            }
        });

        // Reset cart completely
        cart = [];

        // Save updated equipment inventory and cleared cart to localStorage
        localStorage.setItem('gearRigEquipment', JSON.stringify(equipmentData));
        localStorage.setItem('gearRigCart', JSON.stringify(cart));

        alert('Checkout successful! Inventory updated and cart reset.');
        
        // Re-render cart interface to show empty state
        initializeCart();
        freshForm.reset();
    });
}

// get valid src string from php endpoint,  

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