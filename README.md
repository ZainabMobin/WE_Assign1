# GearRig : Event Equipment Checkout for University

A modular, responsive web prototype designed for university event equipment depots. Eliminates stale inventory data, gives item accountability tracking and enforces institutional identification.

## Setup & Running Instructions

**STACK:**
- PHP 8.5 with PDO and SQLite/MySQL.
- json api endpoints

### Quick Start (Local Execution)
1. **Clone or Download** this repository to your local machine.
2. In case of custom assets, ensure folder structure matches the project layout (`./assets/img/`) and relevant naming scheme.
3. Start php server on port 8000:

```bash
php -S 127.0.0.1:8000
```
4. View frontend on: [http://127.0.0.1:8000/frontend/index.html](http://127.0.0.1:8000/frontend/index.html)

- start/ensure mysql service daemon is running. 
- init db: insert the script first of all (or can have a backup file for the db)
- ensure php is installed, start php server

### Project Directory Overview

```
.
├── backend
│   ├── api
│   │   └── image.php
│   └── schema.sql
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
│   ├── script.js
│   └── style.css
└── README.md
```

#### Documentation:
- All md files serve as documentation, present in the `/docs` folder. 

#### Backend:


#### Frontend:
- `/assets` contains project images and fonts.
- Contains three linked html pages: `index.html`, `catalogue.html` and `cart.html`
- Shared css and js files are used among all three html pages.  


## Assignment 2 deliverables:

backend php, db connection check
try catch statements
layered backend statement
email service for order verification
pagination of results
filtering of data
Add email confirmation for initial student email provided, code must match and expiry is 10 mins.


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

## Assigned Idea & Core Rules

* **Assigned Idea:** University Equipment Checkout & Depot Logistics (`GearRig`).
* **Enforced Business Rules: See **[System Design Note & Business Rules](./docs/design-note.md)**.

## Technical Implementation & Architecture

* **Frontend Stack:** Semantic HTML5, CSS3 (Flexbox/Grid, CSS Variables), and Vanilla JavaScript (ES6).
* **Client vs. Server:** This application runs 100% in the browser client. All equipment inventory, cart states, and checkout restrictions persist locally using the browser's `localStorage` API without requiring an external backend database.
* **Responsive Design:** Includes media-query for mobile devices, tablets, and desktop displays.

## AI Assistance, Assets and help citation

- [Thaura.ai](https://thaura.ai/)
- [Gemini](https://gemini.google.com/)
- [StackOverflow](https://stackoverflow.com/questions/74913209/how-to-bring-circles-to-a-vertical-line-in-css-for-vertical-timeline)
- [GoogleFonts](https://fonts.google.com/)