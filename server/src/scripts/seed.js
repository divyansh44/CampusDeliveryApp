const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { pool, connectDB } = require("../config/db");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, "../../.env") });

// Maps food images (served from client/public/) to menu items
const IMG = (n) => `/food${n}.jpg`;

const seedData = async () => {
  try {
    await connectDB();

    console.log("Dropping existing schema...");
    await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    console.log("Executing schema.sql...");
    const schemaPath = path.join(__dirname, "../../schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    await pool.query(schemaSql);
    console.log("Schema initialized.");

    console.log("Seeding data...");

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("password123", salt);
    const adminHash = await bcrypt.hash("admin123", salt);

    // ── Users ──
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      ["Campus Admin", "admin@iitism.ac.in", adminHash, "admin"]
    );

    const vendor1Res = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      ["Ramesh Kumar", "vendor@iitism.ac.in", hash, "vendor"]
    );

    const vendor2Res = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      ["Sunita Devi", "vendor2@iitism.ac.in", hash, "vendor"]
    );

    const studentRes = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      ["Arjun Sharma", "student@iitism.ac.in", hash, "student"]
    );

    const driver1Res = await pool.query(
      `INSERT INTO users (name, email, password, role, is_available, current_zone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email`,
      ["Ravi Singh", "driver@iitism.ac.in", hash, "delivery", true, "Hostel Square"]
    );

    const driver2Res = await pool.query(
      `INSERT INTO users (name, email, password, role, is_available, current_zone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email`,
      ["Amit Yadav", "driver2@iitism.ac.in", hash, "delivery", true, "Main Gate"]
    );

    // ── Shop 1: Campus Canteen (vendor1) ──
    const shop1Res = await pool.query(
      `INSERT INTO shops (owner_id, name, description, category, location, contact_number, delivery_supported, pickup_supported, is_open)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        vendor1Res.rows[0].id,
        "Campus Canteen",
        "Classic Indian meals served fresh every day. Dal, rice, sabzi and more.",
        "Meals",
        "Main Academic Block, Ground Floor",
        "9876543210",
        true, true, true,
      ]
    );
    const shop1 = shop1Res.rows[0].id;

    await pool.query(
      `INSERT INTO menu_items (shop_id, name, description, category, price, image_url, is_available) VALUES
       ($1, 'Chole Bhature',       'Crispy bhature with spicy chole — campus favourite.',         'Main Course', 60,  $2, true),
       ($1, 'Dal Rice Thali',      'Comforting dal with steamed rice and a roti on the side.',    'Main Course', 70,  $3, true),
       ($1, 'Paneer Butter Masala','Creamy tomato-based paneer curry, best with roti or naan.',   'Main Course', 90,  $4, true),
       ($1, 'Pav Bhaji',           'Mumbai-style spiced bhaji with buttery pav.',                 'Snacks',      50,  $5, true),
       ($1, 'Dhokla',              'Soft and spongy Gujarati dhokla with green chutney.',         'Snacks',      40,  $6, true),
       ($1, 'Masala Dosa',         'Crispy golden dosa stuffed with spiced potato filling.',      'South Indian', 55, $7, true)`,
      [shop1, IMG(1), IMG(2), IMG(3), IMG(4), IMG(5), IMG(6)]
    );

    // ── Shop 2: Snack Corner (vendor2) ──
    const shop2Res = await pool.query(
      `INSERT INTO shops (owner_id, name, description, category, location, contact_number, delivery_supported, pickup_supported, is_open)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        vendor2Res.rows[0].id,
        "Snack Corner",
        "Quick bites, beverages and street food for between classes.",
        "Snacks",
        "Library Block, Near Entrance",
        "9123456780",
        true, true, true,
      ]
    );
    const shop2 = shop2Res.rows[0].id;

    await pool.query(
      `INSERT INTO menu_items (shop_id, name, description, category, price, image_url, is_available) VALUES
       ($1, 'Maggi Noodles',  'Classic Maggi cooked with veggies and masala.',           'Snacks',    35, $2, true),
       ($1, 'Samosa (2 pcs)', 'Golden fried samosa with potato filling and chutney.',    'Snacks',    25, $3, true),
       ($1, 'Cold Coffee',    'Chilled blended coffee with ice cream.',                  'Beverages', 60, $4, true),
       ($1, 'Masala Chai',    'Hot ginger-cardamom tea, freshly brewed.',                'Beverages', 15, $5, true),
       ($1, 'Veg Sandwich',   'Toasted sandwich with paneer, veggies and green chutney.','Snacks',    50, $6, true)`,
      [shop2, IMG(5), IMG(1), IMG(6), IMG(2), IMG(4)]
    );

    const admin = adminRes.rows[0];
    const vendor = vendor1Res.rows[0];
    const vendor2 = vendor2Res.rows[0];
    const student = studentRes.rows[0];
    const driver1 = driver1Res.rows[0];
    const driver2 = driver2Res.rows[0];

    console.log("\n✅ Seed complete!\n");
    console.log(JSON.stringify({
      admin:   { email: admin.email,   password: "admin123" },
      vendor:  { email: vendor.email,  password: "password123", shop: "Campus Canteen" },
      vendor2: { email: vendor2.email, password: "password123", shop: "Snack Corner" },
      student: { email: student.email, password: "password123" },
      driver:  { email: driver1.email, password: "password123" },
      driver2: { email: driver2.email, password: "password123" },
    }, null, 2));

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
