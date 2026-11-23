-- GEARRIG DATABASE SCHEMA & SEED SCRIPT (MySQL 8.0+)
DROP DATABASE IF EXISTS gearrig_db;
CREATE DATABASE gearrig_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gearrig_db;

-- 1. USERS
CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- 2. STAFF
CREATE TABLE staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- 3. PRODUCTS
CREATE TABLE product (
    prod_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount_stock INT NOT NULL DEFAULT 0 CHECK (amount_stock >= 0)
   );

-- 4. COLOURS
CREATE TABLE colour (
    colour_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 5. CATEGORIES
CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- PRODUCT_COLOURS (many to many)
CREATE TABLE product_colour (
    prod_id INT NOT NULL,
    colour_id INT NOT NULL,
    PRIMARY KEY (prod_id, colour_id),

    CONSTRAINT fk_pcol_prod FOREIGN KEY (prod_id) 
        REFERENCES product(prod_id) ON DELETE CASCADE,
    CONSTRAINT fk_pcol_col FOREIGN KEY (colour_id) 
        REFERENCES colour(colour_id) ON DELETE CASCADE
);
-- PRODUCT_CATEGORIES (many to many)
CREATE TABLE product_category(
    prod_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (prod_id, category_id),

    CONSTRAINT fk_pcat_prod FOREIGN KEY (prod_id) 
        REFERENCES product(prod_id) ON DELETE CASCADE,
    CONSTRAINT fk_pcat_cat FOREIGN KEY (category_id) 
        REFERENCES category(category_id) ON DELETE CASCADE
);

-- 6. ORDERS
CREATE TABLE borrow_order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('PENDING', 'CONFIRMED', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED') 
        NOT NULL DEFAULT 'PENDING',
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    
    user_id INT NOT NULL,
    issue_staff_id INT NULL, -- NULL while PENDING; set when CONFIRMED or CANCELLED

    CONSTRAINT fk_order_user FOREIGN KEY (user_id) 
        REFERENCES user(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_staff FOREIGN KEY (issue_staff_id) 
        REFERENCES staff(staff_id) ON DELETE SET NULL
);

-- 7. BORROWED_ITEMS (Order Items and Pre-Issue Condition)
CREATE TABLE borrowed_item (
    borrow_id INT AUTO_INCREMENT PRIMARY KEY,
    qty_borrowed INT NOT NULL CHECK (qty_borrowed > 0),
    condition_out_rating ENUM('EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'BROKEN') 
        NOT NULL DEFAULT 'FAIR',
    condition_out_notes VARCHAR(255) NULL,
    
    order_id INT NOT NULL,
    prod_id INT NOT NULL,
    CONSTRAINT fk_bi_order FOREIGN KEY (order_id) 
        REFERENCES borrow_order(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_bi_prod FOREIGN KEY (prod_id) 
        REFERENCES product(prod_id) ON DELETE RESTRICT
);

-- 8. RETURN_LOGS (Partial/Split Return Events and Post-Return Condition)
CREATE TABLE return_logs (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    qty_returned INT NOT NULL CHECK (qty_returned > 0),
    return_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    condition_in_rating ENUM('EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED') NOT NULL DEFAULT 'FAIR',
    condition_in_notes VARCHAR(255) NULL,

    borrow_id INT NOT NULL,
    receive_staff_id INT NOT NULL,
    CONSTRAINT fk_rl_item FOREIGN KEY (borrow_id) 
        REFERENCES borrowed_item(borrow_id) ON DELETE CASCADE,
    CONSTRAINT fk_rl_staff FOREIGN KEY (receive_staff_id) 
        REFERENCES staff(staff_id) ON DELETE RESTRICT
);


-- Colours
INSERT INTO colour (colour_id, name) VALUES 
(1, 'Gold'), (2, 'White'), (3, 'Red'), 
(4, 'Black'), (5, 'Silver'), (6, 'Green'), (7, 'Blue');

-- Categories
INSERT INTO category (category_id, name) VALUES 
(1, 'Electronics'), (2, 'Staging');

-- Products
INSERT INTO product (prod_id, name, description, amount_stock) VALUES
    (1, 'Spotlight', '18W golden beam, adjustable mount', 20),
    (2, 'Flood Light', '20W wide-angle LED, IP65 rated', 20),
    (3, 'Velvet Carpet', 'Linen-backed crimson runner, 10m roll', 20),
    (4, 'Speakers', '150dB peak SPL, dual XLR/TRS input', 20),
    (5, 'Microphone', '-54dBV/Pa sensitivity', 20),
    (6, 'RGB LED Strip', 'Flexible 5m strip', 20);

-- Product Categories
INSERT INTO product_category (prod_id, category_id) VALUES
    (1, 1), (1, 2), -- 1 - electronics, staging
    (2, 1), -- 2 electronics         
    (3, 2), -- 3- staging    
    (4, 1), -- 4 electronics
    (5, 1), -- 5 electronics
    (6, 1), (6,2); -- 6 electronics, staging

-- Product Colours
INSERT INTO product_colour (prod_id, colour_id) VALUES
    (1, 1), -- 1 gold
    (2, 2), -- 2 white  
    (3, 3), -- 3 red        
    -- 4, 5 have no colours
    (6, 3), (6, 6), (6,7);-- 3 red green blue        
    

-- Staff Accounts
INSERT INTO staff (staff_id, email, password_hash) VALUES
    (1, 'tariq.depot@nust.edu.pk', '$2y$10$UOQkVNj3/xvYedU9wZGXTeCoK6MmR7WTux62oqbQc8RcI9jy3gtXK'), -- Staff1
    (2, 'ayesha.depot@nust.edu.pk', '$2y$10$rex0wbPWCns5CWhUlYdUDuJXloenKptYppf5zZHIFKAYcxQnco0Zm'); -- Staff2

-- Student Users
INSERT INTO user (user_id, email,password_hash) VALUES
    (1, 'aa.bese24seecs@nust.edu.pk', '$2y$10$44fB0j0NvvrW9H5lreuZZODHJ9MiBzKVI6Amu4JV2/hFoTzWnHUCu'), -- Student1
    (2, 'bb.bese26seecs@nust.edu.pk', '$2y$10$5stUGVL7NRM6RO.JMnlQ7OxYREMA5mIM4F.8Lga69n6Nonhtsf/9G'), -- Student2
    (3, 'cc.beee23seecs@nust.edu.pk', '$2y$10$BCW8HycHpGLLxc..vlc.wuzV1ioJ18golMbYzg5Wq27tl83wE2ULa'), -- Student3
    (4, 'dd.beee23seecs@nust.edu.pk', '$2y$10$OJ7/oGx9YDHLkG.Wp9b7Bu7yFTGQ.ULThqFAttnlln2CNL4CxnLa2'), -- Student4 
    (5, 'ee.bsds25seecs@nust.edu.pk', '$2y$10$3aXfca0kpoZklURaJizcW.sNiXkvcWYx3tDOqcpRAhvTqJzbaM/zK'), -- Student5
    (6, 'ff.bese24seecs@nust.edu.pk', '$2y$10$rFbA34rOpyYeCbmWRUkWDuN6X.bUQtO.UCqYeCgA0efl0FG/QJr6G'); -- Student6

-- Orders (Using issue_staff_id)
INSERT INTO borrow_order (order_id, user_id, issue_staff_id, status, order_date, due_date) VALUES
    (1, 1, 1, 'CONFIRMED', '2026-11-10 10:00:00', '2026-12-05'),
    (2, 2, 1, 'PARTIALLY_RETURNED', '2026-11-11 14:30:00', '2026-12-18'),
    (3, 3, 2, 'RETURNED', '2026-11-01 09:15:00', '2027-01-04'),
    (4, 4, NULL, 'PENDING', '2026-11-12 11:00:00', '2027-02-15'),
    (5, 5, 2, 'CONFIRMED', '2026-11-15 16:00:00', '2026-11-28'),
    (6, 6, 1, 'CANCELLED', '2026-11-05 12:00:00', '2026-12-10');

-- Borrowed Items (Using ENUM ratings + note columns)
INSERT INTO borrowed_item (borrow_id, order_id, prod_id, qty_borrowed, condition_out_rating, condition_out_notes) VALUES
    (1, 1, 2, 2, 'GOOD', 'Working, lenses clean'),
    (2, 1, 1, 1, 'EXCELLENT', 'Intact, power cord included'),
    (3, 2, 4, 3, 'GOOD', 'Tested audio output, no grille dents'),
    (4, 3, 3, 10, 'GOOD', 'Rolled clean, no stains'),
    (5, 3, 2, 3, 'GOOD', 'Tested OK'),
    (6, 3, 1, 4, 'GOOD', 'Tested OK'),
    (7, 4, 4, 5, 'GOOD', 'Reserved in depot'),
    (8, 4, 5, 4, 'GOOD', 'Reserved in depot'),
    (9,  5, 4, 2, 'GOOD', 'Good condition'),
    (10, 5, 3, 4, 'GOOD', 'Good condition'),
    (11, 5, 2, 1, 'GOOD', 'Good condition'),
    (12, 5, 1, 1, 'GOOD', 'Good condition'),
    (13, 6, 5, 2, 'FAIR', 'Cover removed');

-- Return Logs (Using receive_staff_id, borrow_id, and ENUM ratings + notes)
INSERT INTO return_logs (return_id, borrow_id, receive_staff_id, qty_returned, condition_in_rating, condition_in_notes, return_date) VALUES
    (1, 3, 2, 2, 'GOOD', 'Minor scuff on casing', '2026-11-16 15:20:00'),
    (2, 4, 1, 10, 'EXCELLENT', 'Clean, vacuumed before return', '2026-11-14 11:00:00'),
    (3, 5, 1, 3, 'GOOD', 'All 3 functional', '2026-11-14 11:05:00'),
    (4, 6, 1, 4, 'GOOD', 'All 4 functional', '2026-11-14 11:10:00');