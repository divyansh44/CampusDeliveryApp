const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatar_url,
  role: user.role,
  isActive: user.is_active,
  isAvailable: user.is_available,
  currentZone: user.current_zone,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required.");
  }

  if (role === "admin") {
    res.status(403);
    throw new Error("Admin accounts cannot be self-registered.");
  }

  const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  if (existingUser.rows.length > 0) {
    res.status(409);
    throw new Error("A user with this email already exists.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const isAvailable = role === "delivery";

  const newUser = await pool.query(
    "INSERT INTO users (name, email, password, phone, role, is_available) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [name, email.toLowerCase(), hashedPassword, phone, role || "student", isAvailable]
  );
  
  const user = newUser.rows[0];

  const token = generateToken({ id: user.id, role: user.role });

  res.status(201).json({
    success: true,
    message: "User registered successfully.",
    data: {
      user: sanitizeUser(user),
      token,
    },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  if (userQuery.rows.length === 0) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }
  
  const user = userQuery.rows[0];

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  const token = generateToken({ id: user.id, role: user.role });

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      user: sanitizeUser(user),
      token,
    },
  });
});

const googleLogin = asyncHandler(async (req, res) => {
  const { credential, role } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error("Google credential is required.");
  }

  if (!googleClient) {
    res.status(500);
    throw new Error("Google login is not configured on the server.");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.sub) {
    res.status(400);
    throw new Error("Invalid Google account payload.");
  }

  let userQuery = await pool.query(
    "SELECT * FROM users WHERE google_id = $1 OR email = $2",
    [payload.sub, payload.email.toLowerCase()]
  );

  let user;

  if (userQuery.rows.length === 0) {
    const isAvailable = role === "delivery";
    const newUser = await pool.query(
      "INSERT INTO users (name, email, google_id, avatar_url, role, is_available) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        payload.name || payload.email.split("@")[0],
        payload.email.toLowerCase(),
        payload.sub,
        payload.picture || "",
        role || "student",
        isAvailable
      ]
    );
    user = newUser.rows[0];
  } else {
    const existing = userQuery.rows[0];
    const updatedUser = await pool.query(
      "UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3 RETURNING *",
      [payload.sub, payload.picture || existing.avatar_url, existing.id]
    );
    user = updatedUser.rows[0];
  }

  const token = generateToken({ id: user.id, role: user.role });

  res.status(200).json({
    success: true,
    message: "Google login successful.",
    data: {
      user: sanitizeUser(user),
      token,
    },
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: sanitizeUser(req.user),
  });
});

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getProfile,
};
