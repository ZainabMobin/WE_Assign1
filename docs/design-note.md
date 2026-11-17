# Scenario

The Media Services office at a university lends out event equipment, projectors, microphones, speakers and lighting, to students, staff and instructors. Bookings are made by email and tracked on a paper sheet at the counter. The office serves dozens of departments, and every item must be ready for the next event on time. Three failures keep repeating:

- A student returns a spotlight late, but the sheet is updated only when staff get to it. Another student arrives to pick it up and finds the shelf empty.
- A sound system comes back with broken parts. Nobody recorded its condition at checkout, so there is no proof of who damaged it.
- A microphone goes missing for weeks. The borrower's phone number is fake and the email bounces, and the trail ends there.

## Stakeholder Use Cases

- **Borrower:** I want to see which projectors are free next Friday, so that I can book one without calling the office (fast access to current status of equipment)
- **Staff:** I want to see all outstanding checkouts, so that I can follow up on overdue items
- **Staff:** Equipment returns take more time than promised, giving information mismatch (update latency, stale data persists)
- **Staff:** equipment returned in damaged form, or not at all. (no way to track it). 
- **Staff:**  In unfortunate cases, burner phone numbers and dead emails are provided, cutting off tracking link resulting in equipment loss. 

# Requirements Analysis

## Functional Requirements

- the system records item condition at checkout and at return
- staff can list all items available, currently checked out and overdue
- Users can view all available and unavailable items and thier quantity.
- Verification of university email for integrity, equipment return tracking/liason

## Non-Functional Requirements

- Accessability for mobile screens and occasionally tablet screens
- Fast filtering for equipment

# Business Rules

### Product

- Products can have 0 colours (inferred as none), and may have more than 1 colour (mant to many relationship).
- Products can have no category (inferred as misc), and may fall in more than 1 categories (many to many relationship)

### Borrower
* **Institutional Verification:** Checkout requires a valid `@nust.edu.pk` email address; non-institutional domains are rejected on the server.
* **Booking Window:** Return `due_date` must fall strictly between the current date (`TODAY`) and `TODAY + 4 months`.
* **Cart & Quantity Caps:** Empty carts cannot be submitted; requested quantities cannot exceed current available stock.
* **Stock Reservation:** Submitting an order decrements stock and places it in `PENDING` status for gear reservation.
* **Cancellations:** Borrowers cannot cancel orders online once placed; cancellations must be requested in person at the depot counter.
* **Order Request (`PENDING`):** upon checkout, borrower verifies their university email by confirmation code.

### Depot Staff (Operator)

Staff ID is logged in all stated of order processing: `pending to confirmed`, `partially returned` and `returned`.

* **Authentication & Access:** Staff must log in with verified credentials to access handover, return, and cancellation endpoints.

* **Order Handover (`PENDING` $\rightarrow$ `CONFIRMED`):** Staff verifies borrower in person, inspects gear and logs condition for each.
* **Order Cancellation (`PENDING` $\rightarrow$ `CANCELLED`):** Staff can cancel an uncollected order in person, or on a request expiry for duration `3 days`.
* **Partial & Full Returns (`CONFIRMED` $\rightarrow$ `PARTIALLY_RETURNED` / `RETURNED`):**
  * Staff logs each returned item in batch with conditions in a Return Log
  * Different staff members may process checkout, cancellation of order and return of batches.
  * Returned quantities are added back to stock.