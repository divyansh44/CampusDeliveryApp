const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { pool, connectDB } = require("../config/db");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, "../../.env") });

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
    
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    // Create Admin
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      ["Campus Admin", "admin@iitism.ac.in", passwordHash, "admin"]
    );
    const admin = adminRes.rows[0];

    // Create Vendor
    const vendorRes = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      ["Vendor Demo", "vendor@iitism.ac.in", passwordHash, "vendor"]
    );
    const vendor = vendorRes.rows[0];

    // Create Student
    const studentRes = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      ["Student Demo", "student@iitism.ac.in", passwordHash, "student"]
    );
    const student = studentRes.rows[0];

    // Create Driver
    const deliveryRes = await pool.query(
      `INSERT INTO users (name, email, password, role, is_available, current_zone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email`,
      ["Driver Demo", "driver@iitism.ac.in", passwordHash, "delivery", true, "Hostel Square"]
    );
    const delivery = deliveryRes.rows[0];

    // Create Shop for Vendor
    const shopRes = await pool.query(
      `INSERT INTO shops (owner_id, name, description, category, location, contact_number, delivery_supported, pickup_supported)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [vendor.id, "Campus Bites", "Affordable meals and snacks inside campus.", "Food", "Main Academic Block", "9999999999", true, true]
    );
    const shop = shopRes.rows[0];

    // Create Menu Items
    await pool.query(
      `INSERT INTO menu_items (shop_id, name, description, category, price, is_available) VALUES 
      ($1, $2, $3, $4, $5, $6),
      ($1, $7, $8, $9, $10, $11)`,
      [
        shop.id, "Veg Sandwich", "Toasted sandwich with fresh vegetables.", "Snacks", 60, true,
        "Cold Coffee", "Chilled coffee drink.", "Beverages", 50, true
      ]
    );

    console.log("Seed complete.");
    console.log(
      JSON.stringify(
        {
          admin: { email: admin.email, password: "password123" },
          vendor: { email: vendor.email, password: "password123" },
          student: { email: student.email, password: "password123" },
          delivery: { email: delivery.email, password: "password123" },
          shopId: shop.id,
        },
        null,
        2
      )
    );

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
