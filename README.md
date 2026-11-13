# GearRig : Event Equipment Checkout for University

A modular, responsive web prototype designed for university event equipment depots. Eliminates stale inventory data, gives item accountability tracking and enforces institutional identification.

## Setup & Running Instructions

Because this application runs entirely as a client-side frontend prototype using vanilla technologies (`localStorage`), **no backend server, build tool, or package manager (like npm/Node) is required**.



### Quick Start (Local Execution)
1. **Clone or Download** this repository to your local machine.
2. In case of custom assets, ensure folder structure matches the project layout (`./assets/img/`).
3. Open **`catalogue.html`** or **`index.html`** directly in any modern web browser (Chrome, Firefox, Edge, Safari), OR:
4. Open the project root folder in **VS Code** and use the **Live Server** extension to launch `catalogue.html`.

### Project Directory Overview

- All md files serve as documentation, present in the `/docs` folder. 
- `/assets` contains project images and fonts.
- Contains three linked html pages: `index.html`, `catalogue.html` and `cart.html`
- Shared css and js files are used among all three html pages.  

```
.
├── assets
│   ├── fonts
│   └── img
├── cart.html
├── catalogue.html
├── docs
│   ├── design-note.md
│   ├── img
│   ├── responsive-design.md
│   ├── wdlc.md
│   └── wireframe.md
├── index.html
├── README.md
├── script.js
└── style.css
```

## Documentation & Links

* **[Design Notes & Problem Analysis](./docs/design-note.md)**: Scenario description, pain points and subsequent requirement ellicitation.
* **[Wireframe Blueprint](./docs/wireframe.md)**: Layout architecture and UI wireframe flows for landing catalogue and cart pages.
* **[WDLC Documentation Stages](./docs/wdlc.md)**:  Complete lifecycle documentation from Information Gathering to System Design.

## Assigned Idea & Core Rules

* **Assigned Idea:** University Equipment Checkout & Depot Logistics (`GearRig`).
* **Enforced Business Rules:**
  * **Institutional Identity:** Checkouts require a verified university email ending strictly with `@nust.edu.pk`.
  * **Return Constraints:** Return dates are restricted dynamically (from current day up to a maximum of 4 months out).
  * **Inventory Sync:** Cart quantities cannot exceed available stock; checking out successfully decrements live stock and resets the cart state across pages using `localStorage`.

## Technical Implementation & Architecture

* **Frontend Stack:** Semantic HTML5, CSS3 (Flexbox/Grid, CSS Variables), and Vanilla JavaScript (ES6).
* **Client vs. Server:** This application runs 100% in the browser client. All equipment inventory, cart states, and checkout restrictions persist locally using the browser's `localStorage` API without requiring an external backend database.
* **Responsive Design:** Includes media-query for mobile devices, tablets, and desktop displays.

## AI Assistance, Assets and help citation

- [Thaura.ai](https://thaura.ai/)
- [Gemini](https://gemini.google.com/)
- [StackOverflow](https://stackoverflow.com/questions/74913209/how-to-bring-circles-to-a-vertical-line-in-css-for-vertical-timeline)
- [GoogleFonts](https://fonts.google.com/)