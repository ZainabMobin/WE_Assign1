// equipment stats
// Ateast 1 Category MUST, can be more than 1
// Colours may or may not be set
// Equipment schema:
// {Prodid, 
// name, 
// Desc,
// amount-stock, 
// colour,
// Category: [ electronics, staging ] }

// Equipment list:
// Spotlight - 18W golden , staging, electronics, gold
// Flood light - 20W , electronics, white
// Velvet carpet - linen based and crimson,  staging, red
// Speakers - 150db range, no colour, electronics
// microphone - sentisitiviy range or spec ,no colour , electronics 

// Card: 
// Prod image
// Prod name
// Prod desc stats 1line
// Category badges (colour, any categories, small)
// Green + what amount 
// Or gray + out of stock

// Filters (3 set side by side)
// Category: Electronics, Staging, misc
// Colours: none, all, vbgyor bw gold silver
// Status: Available, not available

// Borrow record schema
// { Token number, 
// Email, 
// Return time,
// borrows: [ (Prod id, amount borrowed),
// (Prodid, amnt borrowed)] }

// Borrow records 
// 6 student records = 6 borrows done already
// zmobin.bese24seecs@seecs.edu.pk : 5th Dec 2026, [(flood light, 2), (spotlight, 1)]
// aomar.bese26seecs@seecs.edu.pk : 18th Dec 2026, [ (speaker, 3)]
// thassan.beee23seecs@seecs.edu.pk : 4th Jan 2027, [(velvet carpet, 10),(flood light, 3), (spotlight, 4)]
// skhan.beee23seecs@seecs.edu.pk : 15th Feb 2027 , [(speaker, 5), (microphone, 4)]
// wfatima.bsds25seecs@seecs.edu.pk : 28th Nov 2026, [(speaker, 2), (red carpet, 4), (flood light, 1), (spotlight, 1)]


// Testing:
//  return date 
// exceeding 4 months, less than 1 hr, past time
// email
// Not valid university email domain checked for student.Nust.edu.pk
// amount
// Greater than 0, less than eq total stock
// Borrow list
// Nothing in list cart empty. Checkout button disabled. No record generation in js


// fallback if localStorage is empty
const defaultEquipment = [
    {
        prodId: "EQ-001",
        name: "Spotlight",
        desc: "18W golden beam, adjustable mount",
        amountStock: 12,
        colour: "gold",
        categories: ["electronics", "staging"],
        image: "./assets/img/spotlight.jpeg"
    },
    {
        prodId: "EQ-002",
        name: "Flood Light",
        desc: "20W wide-angle LED, IP65 rated",
        amountStock: 0,
        colour: "white",
        categories: ["electronics"],
        image: "./assets/img/floodlight.jpeg"
    },
    {
        prodId: "EQ-003",
        name: "Velvet Carpet",
        desc: "Linen-backed crimson runner, 10m roll",
        amountStock: 6,
        colour: "red",
        categories: ["staging"],
        image: "./assets/img/carpet.png"
    },
    {
        prodId: "EQ-004",
        name: "Speakers",
        desc: "150dB peak SPL, dual XLR/TRS input",
        amountStock: 4,
        colour: "none",
        categories: ["electronics"],
        image: "./assets/img/speakers.png"
    },
    {
        prodId: "EQ-005",
        name: "Microphone",
        desc: "-54dBV/Pa sensitivity",
        amountStock: 9,
        colour: "none",
        categories: ["electronics"],
        image: "./assets/img/microphone.jpg"
    }
];

// Load equipment data and cart from localStorage
let equipmentData = JSON.parse(localStorage.getItem('gearRigEquipment')) || defaultEquipment;
let cart = JSON.parse(localStorage.getItem('gearRigCart')) || [];

function initializeCatalogue() {
    const gridContainer = document.querySelector('.product-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    equipmentData.forEach(item => {
        const isAvailable = item.amountStock > 0;
        
        let badgesHTML = item.categories
            .map(cat => `<span class="badge badge-cat">${cat}</span>`)
            .join('');

        if (item.colour && item.colour.toLowerCase() !== 'none') {
            badgesHTML += `<span class="badge badge-color">${item.colour}</span>`;
        }

        const cell = document.createElement('div');
        cell.className = 'product-cell';

        cell.innerHTML = `
            <div class="prod-img-box">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="prod-info">
                <h3 class="prod-name">${item.name}</h3>
                <p class="prod-desc">${item.desc}</p>
                <div class="prod-badges">
                    ${badgesHTML}
                </div>
            </div>
            <div class="prod-status ${isAvailable ? 'status-available' : 'status-unavailable'}">
                <span class="status-dot"></span>
                <span class="status-text">${isAvailable ? `${item.amountStock} in stock` : 'Out of stock'}</span>
            </div>
            <button class="prod-action-btn" data-id="${item.prodId}" ${!isAvailable ? 'disabled' : ''}>
                ${isAvailable ? 'Add to Cart' : 'Unavailable'}
            </button>
        `;

        gridContainer.appendChild(cell);
    });

    // Add to Cart event listeners
    document.querySelectorAll('.prod-action-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const prodId = e.target.getAttribute('data-id');
            const product = equipmentData.find(p => p.prodId === prodId);

            if (!product) return;

            const existing = cart.find(item => item.prodId === prodId);
            if (existing) {
                if (existing.quantity < product.amountStock) {
                    existing.quantity += 1;
                    alert('Item quantity updated in cart!');
                } else {
                    alert('Cannot add more than available stock.');
                }
            } else {
                cart.push({ prodId: prodId, quantity: 1 });
                alert('Item added to cart!');
            }

            // Save updated cart to localStorage
            localStorage.setItem('gearRigCart', JSON.stringify(cart));
        });
    });
}

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
        cartGrid.innerHTML = `<div class="empty-cart">
                                Your cart is empty. Browse the Catalogue to add gear.
                            </div>`;
        return;
    }

    cart.forEach(cartItem => {
        const product = equipmentData.find(eq => eq.prodId === cartItem.prodId);
        if (!product) return; 

        // Disable '+' button if cart quantity equals or exceeds available stock
        const isMaxStock = cartItem.quantity >= product.amountStock;

        const cartCell = document.createElement('div');
        cartCell.className = 'cart-cell-item';

        cartCell.innerHTML = `
            <div class="cart-item-img-box">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="cart-item-info">
                <h3 class="cart-item-name">${product.name}</h3>
                <span class="cart-item-spec">${product.desc}</span>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn qty-dec" data-id="${product.prodId}">-</button>
                <span class="qty-display">${cartItem.quantity}</span>
                <button class="qty-btn qty-inc" data-id="${product.prodId}" ${isMaxStock ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>+</button>
            </div>
            <button class="cart-remove-btn" data-id="${product.prodId}">×</button>
        `;

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