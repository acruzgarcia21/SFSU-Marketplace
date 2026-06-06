const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.test") });

const pool = require("../db/pool");

async function resetTestDb() {
  await pool.query("SET FOREIGN_KEY_CHECKS = 0");

  await pool.query(`DELETE FROM Offer`);
  await pool.query(`DELETE FROM Message`);
  await pool.query(`DELETE FROM Conversation_Participant`);
  await pool.query(`DELETE FROM Conversation`);
  await pool.query(`DELETE FROM Listing_Image`);
  await pool.query(`DELETE FROM Listing`);
  await pool.query(`DELETE FROM User`);

  await pool.query(`ALTER TABLE Offer AUTO_INCREMENT = 1`);
  await pool.query(`ALTER TABLE Message AUTO_INCREMENT = 1`);
  await pool.query(`ALTER TABLE Conversation AUTO_INCREMENT = 1`);
  await pool.query(`ALTER TABLE Listing_Image AUTO_INCREMENT = 1`);
  await pool.query(`ALTER TABLE Listing AUTO_INCREMENT = 1`);
  await pool.query(`ALTER TABLE User AUTO_INCREMENT = 1`);

  await pool.query("SET FOREIGN_KEY_CHECKS = 1");

  await pool.query(`
    INSERT INTO User (display_name, sfsu_email, password_hash)
    VALUES
    ('Alex Cruz', 'acruz@sfsu.edu', '$2b$10$sn4AXFTwm22Mn7B0P6iegesiyIrT3qPlYrLHbp/jHu2l7UkVeN9pa'),
    ('Krish Adya', 'krish@sfsu.edu', '$2b$10$qFV5qzjvFpZeC6GfA4tYjOK59J4RJS0rpiaPpjYtEAQETwPHn29hK'),
    ('Akash Goyal', 'akash@sfsu.edu', '$2b$10$8zfE5zssTk2m7BJUTalWhuW63bJkKajuOQlfSVqr4HDZqkBqmFiFi')
  `);

  await pool.query(`
    INSERT INTO Listing
    (seller_id, title, description, price, category_name, course_tag, pickup_location, created_at, item_condition)
    VALUES
      (1, 'Calculus Book', 'Complete calculus textbook with practice problems', 55.00, 'Textbooks', 'MATH 226', 'J. Paul Leonard Library', '2026-01-01 14:37:22', 'Good'),
      (2, 'Math 226 Calculus Notes', 'Detailed handwritten notes for calculus', 20.00, 'Textbooks', 'MATH 226', 'Cesar Chavez Center', '2026-01-02 08:12:49', 'Fair'),
      (3, 'Linear Algebra Reference Book', 'Helpful book for matrices and vector spaces', 35.00, 'Textbooks', 'MATH 325', 'Science Building', '2026-01-03 19:45:03', 'Good'),
      (1, 'CSC 648 Textbook', 'Used software engineering textbook in good condition', 45.00, 'Textbooks', 'CSC 648', 'J. Paul Leonard Library', '2026-01-04 11:06:31', 'Used'),
      (1, 'CSC 413 Programming Book', 'Covers advanced programming concepts', 40.00, 'Textbooks', 'CSC 413', 'Science Building', '2026-01-05 16:58:14', 'Like New'),
      (2, 'Physics Lab Manual', 'Lab manual with mechanics and electricity experiments', 0.00, 'Textbooks', 'PHYS 220', 'Thornton Hall', '2026-01-06 07:29:55', 'Fair'),
      (3, 'Calculus Book Bundle', 'Includes calculus book, formula sheet, and practice exams', 70.00, 'Textbooks', 'MATH 226', 'Science Building', '2026-01-28 21:18:40', 'Like New'),
      (1, 'Study Guide for Calculus', 'This guide mentions book problems and calculus review questions', 12.00, 'Textbooks', 'MATH 226', 'Library Entrance', '2026-01-29 09:43:17', 'Good'),

      (2, 'Graphing Calculator', 'TI calculator works perfectly for calculus exams', 60.00, 'Electronics', NULL, 'Cesar Chavez Center', '2026-01-07 13:22:08', 'Good'),
      (3, 'Bluetooth Speaker', 'Portable speaker with great sound', 25.00, 'Electronics', NULL, 'Student Center', '2026-01-08 17:04:36', 'Used'),
      (1, 'Wireless Mouse', 'Compact wireless mouse for laptop or desktop', 10.00, 'Electronics', NULL, 'Library Entrance', '2026-01-09 20:30:11', 'Good'),
      (3, 'USB-C Hub', 'Adapter with HDMI, USB 3.0, and SD card reader', 22.50, 'Electronics', NULL, 'Business Building', '2026-01-10 10:51:27', 'Like New'),
      (2, 'Gaming Keyboard', 'Mechanical keyboard', 84.00, 'Electronics', NULL, 'Science Building', '2026-01-11 22:15:09', 'New'),
      (1, '#1 Noise-Canceling Headphones', 'Great for studying in loud areas', 75.00, 'Electronics', NULL, 'Library Entrance', '2026-01-12 06:48:53', 'Like New'),

      (3, 'Desk Lamp', 'Small desk lamp for dorm or apartment', 0.00, 'Furniture', NULL, 'Student Center', '2026-01-13 18:33:41', 'Good'),
      (2, 'Office Chair', 'Comfortable chair for studying', 35.00, 'Furniture', NULL, 'Dorm Lobby', '2026-01-14 12:07:19', 'Fair'),
      (1, 'Mini Table', 'Small table for laptop or books', 20.00, 'Furniture', NULL, 'Library Entrance', '2026-01-15 23:42:06', 'Used'),
      (3, 'Bookshelf', 'Wooden shelf for textbooks, binders, and dorm supplies', 30.00, 'Furniture', NULL, 'Dorm Lobby', '2026-01-16 09:24:58', 'Good'),
      (1, 'Mini Fridge', 'Compact fridge for dorm room', 85.00, 'Furniture', NULL, 'Dorm Lobby', '2026-01-23 15:39:12', 'Good'),
      (2, 'Microwave', 'Small microwave, clean and working', 45.00, 'Furniture', NULL, 'Dorm Lobby', '2026-01-24 08:55:47', 'Fair'),
      (3, 'Laundry Basket', 'Large basket for dorm laundry', 0.00, 'Furniture', NULL, 'Student Center', '2026-01-25 19:11:34', 'Used'),

      (1, 'SFSU Hoodie', 'Purple hoodie with SFSU logo', 28.00, 'Apparel', NULL, 'Cesar Chavez Center', '2026-01-17 07:16:25', 'Good'),
      (2, 'Rain Jacket', 'Waterproof jacket for walking across campus', 32.00, 'Apparel', NULL, 'Student Center', '2026-01-18 14:02:44', 'Like New'),
      (3, 'Graduation Gown', 'Bachelor graduation gown used once', 100.00, 'Apparel', NULL, 'Bookstore Entrance', '2026-01-19 21:27:10', 'Like New');
  `);

  await pool.query(`
    INSERT INTO Listing_Image (listing_id, image_file_path, image_order)
    VALUES
    (1, '/images/textbook4.jpg', 1),
    (2, '/images/textbook3.jpg', 1),
    (3, '/images/linear-algebra.jpg', 1),
    (4, '/images/textbook1.jpg', 1),
    (5, '/images/textbook2.jpg', 1),
    (6, '/images/physics-lab-manual.jpg', 1),
    (7, '/images/calculus-book-bundle.jpg', 1),
    (8, '/images/calculus-study-guide.jpg', 1),
    (9, '/images/calculator1.jpg', 1),
    (10, '/images/speaker1.jpg', 1),
    (11, '/images/mouse1.jpg', 1),
    (12, '/images/usb-c-hub.jpg', 1),
    (13, '/images/gaming-keyboard.jpg', 1),
    (14, '/images/headphones.jpg', 1),
    (15, '/images/lamp1.jpg', 1),
    (16, '/images/chair1.jpg', 1),
    (17, '/images/table1.jpg', 1),
    (18, '/images/bookshelf.jpg', 1),
    (19, '/images/mini-fridge.jpg', 1),
    (20, '/images/microwave.jpg', 1),
    (21, '/images/laundry-basket.jpg', 1),
    (22, '/images/sfsu-hoodie.jpg', 1),
    (23, '/images/rain-jacket.jpg', 1),
    (24, '/images/graduation-gown.jpg', 1)
  `);

  await pool.query(`
  INSERT INTO Conversation (listing_id, conversation_type)
  VALUES
  (4, 'direct'),
  (10, 'direct')
`);

  await pool.query(`
  INSERT INTO Conversation_Participant (conversation_id, user_id)
  VALUES
  (1, 1),
  (1, 2),
  (2, 2),
  (2, 3)
`);

  await pool.query(`
  INSERT INTO Message (conversation_id, sender_id, body)
  VALUES
  (1, 1, 'Hey, are you still selling the CSC 648 textbook?'),
  (1, 2, 'Yes, I still have it.'),
  (1, 1, 'Nice, when can we meet?'),
  (2, 2, 'Are you interested in the Bluetooth speaker?'),
  (2, 3, 'Yes, is it still available?')
`);
}

module.exports = { resetTestDb };
