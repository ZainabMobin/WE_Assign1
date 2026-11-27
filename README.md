# GearRig : Event Equipment Checkout for University


<div style="display: flex; justify-content: center">

[![HTML](https://img.shields.io/badge/HTML-%23E34F26.svg?logo=html5&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)](#)
[![JSON](https://img.shields.io/badge/JSON-000?logo=json&logoColor=fff)](#)
[![CSS](https://img.shields.io/badge/CSS-639?logo=css&logoColor=fff)](#)
[![PHP](https://img.shields.io/badge/PHP-%23777BB4.svg?&logo=php&logoColor=white)](#)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=fff)](#)
[![Node.test](https://img.shields.io/badge/Node.test-6DA55F?logo=node.js&logoColor=white)](#)
[![Postman](https://img.shields.io/badge/Postman-FF6C37?logo=postman&logoColor=white)](#)

</div>

A modular, responsive web prototype designed for university event equipment depots. Eliminates stale inventory data, gives item accountability tracking and enforces institutional identification.

## Setup & Running Instructions

### Quick Start (Local Execution)
1. **Clone or Download** this repository to your local machine.
2. In case of custom assets, ensure folder structure matches the project layout (`./assets/img/`) and relevant naming scheme.
3. Log into mysql with user, populate `/backend/.env` with MySQL user credentials:

```
DB_PORT=******
DB_NAME=gearrig_db
DB_USER=******
DB_PASSWORD=******
```
4. Log into mysql with user, create the database with the given seed schema:

```bash
SOURCE /backend/schema.sql
```

5. Start php server on port 8000:

```bash
php -S 127.0.0.1:8000
```
6. View frontend on: [http://127.0.0.1:8000/frontend/index.html](http://127.0.0.1:8000/frontend/index.html)

7. Run test suites
```bash
php -S 127.0.0.1:8000 # server starts running
node --test test/login.test.js # run test suite <endpoint>.test.js
```

### Project Directory Overview

```
.
├── backend
│   ├── api
│   │   ├── checkout.php
│   │   ├── health.php
│   │   ├── image.php
│   │   ├── login.php
│   │   ├── order.php
│   │   └── products.php
│   ├── config
│   │   ├── csrf.php
│   │   └── db.php
│   ├── schema.sql
│   └── tests
│       └── db_helper.php
├── docs
│   ├── design-note.md
│   ├── img
│   ├── responsive-design.md
│   ├── wdlc.md
│   └── wireframe.md
├── frontend
│   ├── assets
│   │   ├── fonts
│   │   └── img
│   ├── cart.html
│   ├── catalogue.html
│   ├── index.html
│   ├── login.html
│   ├── script.js
│   └── style.css
├── README.md
└── test
    ├── checkout.test.js
    └── login.test.js

```

#### Documentation:
- All md files serve as documentation, present in the `/docs` folder. 

#### Backend:
- `/backend` contains server code written in php 
- `/backend/api` contains all API endpoints 
- `/backend/config` contains configuration and utilities such as establishing database connection, csrf validation middleware etc. 
- `/backend/schema.sql` contains database seed schema 
- `/backend/tests/db_helper` contains helper databse functions used in checkout test suite 

#### Frontend:
- `/assets` contains project images and fonts.
- Contains three linked html pages: `index.html`, `catalogue.html` and `cart.html`
- Shared css and js files are used among all three html pages.  

#### Test:
- `/test` contians test suited for backend endpoints with partition strategy mentioned

## Assignment 2 deliverables:

**FRONTEND:**
- Show loading, success, empty and error states without unnecessary page reloads.

**DATABASE:**
- Mysql schema and seed records

**BACKEND:** 
- Implement prepared statements for CRUD operations containing user input.
- Expose at least one JSON endpoint and call it from the browser with Fetch and async/await. 
- Validate data on the server, encode user-controlled output before displaying HTML
- Apply session ownership and CSRF protection using the course scaffold where provided.
- Test at least four cases, including invalid/missing input, a successful update, and an unauthorized or invalid operation. Use browser storage only for a non-sensitive preference.

## Documentation & Links

* **[ERD](./docs/img/erd.png)**: Database schema and ERD
* **[ERD](./docs/img/order-state.png)**: FSM for order state changes

* **[Design Notes & Problem Analysis](./docs/design-note.md)**: Scenario description, pain points and subsequent requirement ellicitation.
* **[Wireframe Blueprint](./docs/wireframe.md)**: Layout architecture and UI wireframe flows for landing catalogue and cart pages.
* **[WDLC Documentation Stages](./docs/wdlc.md)**:  Complete lifecycle documentation from Information Gathering to System Design.
* **[User Flow](./docs/userflow.md)**: documented steps for application usage for the role 'borrower'.

## Assigned Idea & Core Rules

* **Assigned Idea:** University Equipment Checkout & Depot Logistics (`GearRig`).
* **Enforced Business Rules: See **[System Design Note & Business Rules](./docs/design-note.md)**.

## Technical Implementation & Architecture

* **Frontend Stack:** Semantic HTML5, CSS3 (Flexbox/Grid, CSS Variables), and Vanilla JavaScript (ES6).
* **Backend Stack:** PHP 8.5 with PDO for crud operations
* **Database:** Relational MySql
* **CSRF Protection:** Handled from client side via JS `sessionStorage` and server side via validation middlware `/backend/config/csrf.php`
* **Responsive Design:** Includes media-query for mobile devices, tablets, and desktop displays.

## AI Assistance, Assets and help citation

- [Thaura.ai](https://thaura.ai/)
- [Gemini](https://gemini.google.com/)
- [StackOverflow](https://stackoverflow.com/questions/74913209/how-to-bring-circles-to-a-vertical-line-in-css-for-vertical-timeline)
- [GoogleFonts](https://fonts.google.com/)
- [Pinterest](https://www.pinterest.com/)