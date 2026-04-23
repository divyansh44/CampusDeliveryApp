/**
 * Creates or resets an admin user without touching any other data.
 * Usage: node src/scripts/create_admin.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

const ADMIN_EMAIL = "admin@iitism.ac.in";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Campus Admin";

async function createAdmin() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Upsert: if email exists update role+password, otherwise insert
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET role = 'admin', password = $3, is_active = true
       RETURNING id, name, email, role`,
      [ADMIN_NAME, ADMIN_EMAIL, hash]
    );

    const user = result.rows[0];
    console.log("\n✅ Admin user ready:");
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role:     ${user.role}`);
    console.log(`   ID:       ${user.id}\n`);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
