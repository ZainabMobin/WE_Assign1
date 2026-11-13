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


const equipmentData = [
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

function initializeCards() {
    const gridContainer = document.querySelector('.product-grid');
    if (!gridContainer) return;

    // Clear any static placeholders if present
    gridContainer.innerHTML = '';

    equipmentData.forEach(item => {
        const isAvailable = item.amountStock > 0;
        
        // Build category badges HTML
        let badgesHTML = item.categories
            .map(cat => `<span class="badge badge-cat">${cat}</span>`)
            .join('');

        // Include colour badge only if colour is set and not 'none'
        if (item.colour && item.colour.toLowerCase() !== 'none') {
            badgesHTML += `<span class="badge badge-color">${item.colour}</span>`;
        }

        // Create the card container element
        const cell = document.createElement('div');
        cell.className = 'product-cell';

        // Populate card HTML
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
}