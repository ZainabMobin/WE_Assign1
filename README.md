Assignment documentation has been provided, corresponding to development stages of WDLC

Design Note

Wireframe

WDLC

What runs in client side vs server side.

## equipment stats:
Atleast 1 Category MUST, can be more than 1
Colours may or may not be set

## Equipment schema:
```txt
{Prodid, 
name, 
Desc,
amount-stock, 
colour,
Category: [ electronics, staging ] }
```

## Equipment list:
Spotlight - 18W golden , staging, electronics, gold
Flood light - 20W , electronics, white
Velvet carpet - linen based and crimson,  staging, red
Speakers - 150db range, no colour, electronics
microphone - sentisitiviy range or spec ,no colour , electronics 

## Card: 
Prod image
Prod name
Prod desc stats 1line
Category badges (colour, any categories, small)
Green + what amount 
Or gray + out of stock

## Filters (3 set side by side)
Category: Electronics, Staging, misc
Colours: none, all, vbgyor bw gold silver
Status: Available, not available

## Borrow record schema
```plaintext
{ Token number, 
Email, 
Return time,
borrows: [ (Prod id, amount borrowed),
(Prodid, amnt borrowed)] }
```

## Borrow records 
6 student records = 6 borrows done already

- zmobin.bese24seecs@seecs.edu.pk : 5th Dec 2026, [(flood light, 2), (spotlight, 1)]
- aomar.bese26seecs@seecs.edu.pk : 18th Dec 2026, [ (speaker, 3)]
- thassan.beee23seecs@seecs.edu.pk : 4th Jan 2027, [(velvet carpet, 10),(flood light, 3), (spotlight, 4)]
- skhan.beee23seecs@seecs.edu.pk : 15th Feb 2027 , [(speaker, 5), (microphone, 4)]
- wfatima.bsds25seecs@seecs.edu.pk : 28th Nov 2026, [(speaker, 2), (red carpet, 4), - (flood light, 1), (spotlight, 1)]

## Testing:
 return date 
exceeding 4 months, less than 1 hr, past time
email
Not valid university email domain checked for student.Nust.edu.pk
amount
Greater than 0, less than eq total stock
Borrow list
Nothing in list cart empty. Checkout button disabled. No record generation in js

