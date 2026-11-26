const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const LOGIN_URL = 'http://127.0.0.1:8000/backend/api/login.php';
const CHECKOUT_URL = 'http://127.0.0.1:8000/backend/api/checkout.php';
const DB_HELPER = path.resolve(__dirname, '../backend/tests/db_helper.php');

const TEST_CREDENTIALS = {
    email: 'aa.bese24seecs@nust.edu.pk',
    password: 'Student1',
};

const TEST_PRODUCT = {
    name: 'test',
    description: 'test suite desc',
    amount_stock: 10,
};


/***
 * Checkout Partitions: 
 *     csrf_token: valid, invalid
 *     user_id: valid, invalid doesnt exist, 
 *     product: exists, does not exist
 *     quantity: <= stock, > stock
 */

let sessionCookie = '';
let validCsrfToken = '';
let validUserId = null;
let testProdId = null;
let suiteStartTimestamp = '';


function runDbHelper(...args) {
    const stdout = execFileSync('php', [DB_HELPER, ...args], { encoding: 'utf8' });
    return JSON.parse(stdout);
}

function getFutureReturnDate(daysAhead = 7) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().slice(0, 10);
}

async function loginAndInitSession(email, password) {
    const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
        sessionCookie = setCookie.split(';')[0];
    }

    const data = await response.json();
    assert.equal(response.status, 200, `Initial login failed: ${JSON.stringify(data)}`);
    assert.equal(data.ok, true);
    assert.equal(data.authorized, true);
    assert.ok(data.csrf_token, 'Missing csrf_token from login response');

    validCsrfToken = data.csrf_token;
    validUserId = data.user.user_id;
}

function seedTestProduct() {
    const res = runDbHelper(
        'seed-product',
        TEST_PRODUCT.name,
        TEST_PRODUCT.description,
        String(TEST_PRODUCT.amount_stock)
    );
    assert.ok(res.prod_id > 0, 'Failed to seed test product');
    testProdId = res.prod_id;
}

function resetTestProductStock(stock = TEST_PRODUCT.amount_stock) {
    runDbHelper('reset-stock', String(testProdId), String(stock));
}

function getTestProductFromDb() {
    return runDbHelper('get-product', String(testProdId));
}

function getOrderFromDb(orderId) {
    return runDbHelper('get-order', String(orderId));
}

function cleanupSuiteRecords() {
    runDbHelper(
        'cleanup',
        String(testProdId || 0),
        String(validUserId || 0),
        suiteStartTimestamp || '1970-01-01 00:00:00'
    );
}

async function sendCheckoutRequest({
    csrfToken = validCsrfToken,
    cookie = sessionCookie,
    userId = validUserId,
    items = [],
    returnDate = getFutureReturnDate(7),
} = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (csrfToken !== null && csrfToken !== undefined) {
        headers['X-CSRF-Token'] = csrfToken;
    }

    if (cookie) {
        headers['Cookie'] = cookie;
    }

    const response = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            user_id: userId,
            items,
            return_date: returnDate,
        }),
    });

    const data = await response.json();
    return { status: response.status, data };
}

// Happy path: valid csrf, valid user, existing product, quantity <= stock
async function testCheckoutValidCsrfValidUserExistingProductQtyInStock() {
    resetTestProductStock(10);

    const { status, data } = await sendCheckoutRequest({
        csrfToken: validCsrfToken,
        cookie: sessionCookie,
        userId: validUserId,
        items: [{ prod_id: testProdId, quantity: 4 }],
        returnDate: getFutureReturnDate(7),
    });

    assert.equal(status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.issue_staff_id, null);

    const prod = getTestProductFromDb();
    assert.equal(prod.amount_stock, 6);

    const order = getOrderFromDb(data.order_id);
    assert.ok(order);
    assert.equal(order.status, 'PENDING');
    assert.equal(order.user_id, validUserId);
    assert.equal(order.issue_staff_id, null);
}

// Valid csrf, valid user, existing product, quantity > stock
async function testCheckoutValidCsrfValidUserExistingProductQtyExceedsStock() {
    resetTestProductStock(10);

    const { status, data } = await sendCheckoutRequest({
        csrfToken: validCsrfToken,
        cookie: sessionCookie,
        userId: validUserId,
        items: [{ prod_id: testProdId, quantity: 11 }],
        returnDate: getFutureReturnDate(7),
    });

    assert.equal(status, 409);
    assert.equal(data.ok, false);

    const prod = getTestProductFromDb();
    assert.equal(prod.amount_stock, 10);
}

// Valid csrf, valid user, product does not exist, quantity <= stock
async function testCheckoutValidCsrfValidUserNonExistentProductQtyInStock() {
    const { status, data } = await sendCheckoutRequest({
        csrfToken: validCsrfToken,
        cookie: sessionCookie,
        userId: validUserId,
        items: [{ prod_id: 999999, quantity: 1 }],
        returnDate: getFutureReturnDate(7),
    });

    assert.ok([400, 404, 409, 500].includes(status));
    assert.equal(data.ok, false);
}

// Invalid csrf, valid user, existing product, quantity <= stock
async function testCheckoutInvalidCsrfValidUserExistingProductQtyInStock() {
    resetTestProductStock(10);

    const { status, data } = await sendCheckoutRequest({
        csrfToken: 'invalid-token-value',
        cookie: sessionCookie,
        userId: validUserId,
        items: [{ prod_id: testProdId, quantity: 2 }],
        returnDate: getFutureReturnDate(7),
    });

    assert.equal(status, 403);
    assert.equal(data.ok, false);

    const prod = getTestProductFromDb();
    assert.equal(prod.amount_stock, 10);
}

// Merged partition: invalid csrf, invalid/unauthenticated user, non-existent product, quantity > stock
async function testCheckoutMergedInvalidCsrfInvalidUserNonExistentProductQtyExceedsStock() {
    const { status, data } = await sendCheckoutRequest({
        csrfToken: 'invalid-token-value',
        cookie: '',
        userId: 999999,
        items: [{ prod_id: 999999, quantity: 50 }],
        returnDate: getFutureReturnDate(7),
    });

    assert.ok([401, 403].includes(status));
    assert.equal(data.ok, false);
}

// Merged partition: valid csrf, unauthenticated session + invalid user_id, existing product, quantity <= stock
async function testCheckoutValidCsrfInvalidSessionUserExistingProductQtyInStock() {
    resetTestProductStock(10);

    const { status, data } = await sendCheckoutRequest({
        csrfToken: validCsrfToken,
        cookie: '',
        userId: 999999,
        items: [{ prod_id: testProdId, quantity: 2 }],
        returnDate: getFutureReturnDate(7),
    });

    assert.ok([401, 403].includes(status));
    assert.equal(data.ok, false);

    const prod = getTestProductFromDb();
    assert.equal(prod.amount_stock, 10);
}

// Merged partition: valid csrf, valid user, existing + non-existent product combined, quantity > stock
async function testCheckoutMergedExistingAndNonExistentProductQtyExceedsStock() {
    resetTestProductStock(10);

    const { status, data } = await sendCheckoutRequest({
        csrfToken: validCsrfToken,
        cookie: sessionCookie,
        userId: validUserId,
        items: [
            { prod_id: testProdId, quantity: 20 },
            { prod_id: 999999, quantity: 5 },
        ],
        returnDate: getFutureReturnDate(7),
    });

    assert.ok([400, 404, 409, 500].includes(status));
    assert.equal(data.ok, false);

    const prod = getTestProductFromDb();
    assert.equal(prod.amount_stock, 10);
}


describe('checkout partition functions', () => {
    before(async () => {
        const nowRow = runDbHelper('now');
        suiteStartTimestamp = nowRow.now_ts;
        await loginAndInitSession(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
        seedTestProduct();
    });

    after(() => {
        cleanupSuiteRecords();
    });

    it( 'runs testCheckoutValidCsrfValidUserExistingProductQtyInStock', 
        testCheckoutValidCsrfValidUserExistingProductQtyInStock );

    it( 'runs testCheckoutValidCsrfValidUserExistingProductQtyExceedsStock', 
        testCheckoutValidCsrfValidUserExistingProductQtyExceedsStock );

    it( 'runs testCheckoutValidCsrfValidUserNonExistentProductQtyInStock', 
        testCheckoutValidCsrfValidUserNonExistentProductQtyInStock );

    it( 'runs testCheckoutInvalidCsrfValidUserExistingProductQtyInStock', 
        testCheckoutInvalidCsrfValidUserExistingProductQtyInStock );

    it( 'runs testCheckoutMergedInvalidCsrfInvalidUserNonExistentProductQtyExceedsStock', 
        testCheckoutMergedInvalidCsrfInvalidUserNonExistentProductQtyExceedsStock );

    it( 'runs testCheckoutValidCsrfInvalidSessionUserExistingProductQtyInStock', 
        testCheckoutValidCsrfInvalidSessionUserExistingProductQtyInStock );

    it( 'runs testCheckoutMergedExistingAndNonExistentProductQtyExceedsStock', 
        testCheckoutMergedExistingAndNonExistentProductQtyExceedsStock );

});
