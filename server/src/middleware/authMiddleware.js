const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized. Token missing or malformed.");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const { rows } = await pool.query(
    "SELECT id, name, email, google_id, avatar_url, phone, role, is_active, is_available, current_zone, created_at, updated_at FROM users WHERE id = $1",
    [decoded.id]
  );

  const user = rows[0];

  if (!user || !user.is_active) {
    res.status(401);
    throw new Error("Not authorized. User not found or inactive.");
  }

  req.user = user;
  next();
});

module.exports = { protect };
