# Scenario

The Media Services office at a university lends out event equipment, projectors, microphones, speakers and lighting, to students, staff and instructors. Bookings are made by email and tracked on a paper sheet at the counter. The office serves dozens of departments, and every item must be ready for the next event on time. Three failures keep repeating:

- A student returns a spotlight late, but the sheet is updated only when staff get to it. Another student arrives to pick it up and finds the shelf empty.
- A sound system comes back with broken parts. Nobody recorded its condition at checkout, so there is no proof of who damaged it.
- A microphone goes missing for weeks. The borrower's phone number is fake and the email bounces, and the trail ends there.

## Use Cases

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