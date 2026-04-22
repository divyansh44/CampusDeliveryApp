const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "postgres",
  password: process.env.PG_PASSWORD || "welcome123",
  port: process.env.PG_PORT || 6000,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`PostgreSQL Connected: ${client.database}`);
    client.release();
  } catch (err) {
    console.error(`Error connecting to Postgres: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
