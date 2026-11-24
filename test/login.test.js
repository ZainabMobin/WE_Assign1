const url = 'http://127.0.0.1:8000/backend/api/login.php';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

/**
 * login Partition strategy:
 * email: incorrect, correct, empty 
 * password: incorrect, correct, empty 
 */

// happy path emial, password correct
async function testLoginEmailCorrectPasswordCorrect(){

    const email = "aa.bese24seecs@nust.edu.pk";
    const password = "Student1"

    const { status, data } = await sendLoginRequest(email, password);

    assert.equal(status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.authorized, true);
    assert.equal(data.user.email, email);    
}

// email correct password incorrect
async function testLoginEmailCorrectPasswordIncorrect(){
    const email = "aa.bese24seecs@nust.edu.pk";
    const password = "Student99"
    
    const { status, data } = await sendLoginRequest(email, password);

    assert.equal(status, 401);
    assert.equal(data.ok, false);
    assert.equal(data.error, 'Invalid email or password');
    
}

// email incorrect password correct
async function testLoginEmailIncorrectPasswordCorrect(){
    const email = "random.bese24seecs@nust.edu.pk";
    const password = "random99";
    const { status, data } = await sendLoginRequest(email, password);

    assert.equal(status, 401);
    assert.equal(data.ok, false);
    assert.equal(data.error, 'Invalid email or password');
}

// Email empty, password correct
async function testLoginEmailEmptyPasswordCorrect() {
    const email = '';
    const password = 'Student1';
    const { status, data } = await sendLoginRequest(email, password);

    assert.equal(status, 400);
    assert.equal(data.ok, false);
    assert.equal(data.error, 'Email and password are required');
}

// Email correct, password empty
async function testLoginEmailCorrectPasswordEmpty() {
    const email = 'aa.bese24seecs@nust.edu.pk';
    const password = '';
    const { status, data } = await sendLoginRequest(email, password);

    assert.equal(status, 400);
    assert.equal(data.ok, false);
    assert.equal(data.error, 'Email and password are required');
}

// Email empty, password empty
async function testLoginEmailEmptyPasswordEmpty() {
    const email = '';
    const password = '';
    const { status, data } = await sendLoginRequest(email, password);

    assert.equal(status, 400);
    assert.equal(data.ok, false);
    assert.equal(data.error, 'Email and password are required');
}

describe('login partition functions', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('runs testLoginEmailCorrectPasswordCorrect', testLoginEmailCorrectPasswordCorrect);
    it('runs testLoginEmailCorrectPasswordIncorrect', testLoginEmailCorrectPasswordIncorrect);
    it('runs testLoginEmailIncorrectPasswordCorrect', testLoginEmailIncorrectPasswordCorrect);
    it('runs testLoginEmailEmptyPasswordCorrect', testLoginEmailEmptyPasswordCorrect);
    it('runs testLoginEmailCorrectPasswordEmpty', testLoginEmailEmptyPasswordEmpty);
    it('runs testLoginEmailEmptyPasswordEmpty', testLoginEmailEmptyPasswordEmpty);
});



async function sendLoginRequest(email, password) {
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
    return { status: response.status, data };
}