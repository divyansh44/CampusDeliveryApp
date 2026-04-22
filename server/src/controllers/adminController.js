const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const getDashboardSummary = asyncHandler(async (req, res) => {
  const usersQuery = await pool.query("SELECT COUNT(*) FROM users");
  const shopsQuery = await pool.query("SELECT COUNT(*) FROM shops");
  const ordersQuery = await pool.query("SELECT COUNT(*) FROM orders");
  const activeOrdersQuery = await pool.query("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing', 'ready', 'picked_up')");
  
  const revenueQuery = await pool.query("SELECT SUM(total_price) FROM orders WHERE status IN ('ready', 'delivered')");

  res.status(200).json({
    success: true,
    data: {
      totalUsers: parseInt(usersQuery.rows[0].count, 10),
      totalShops: parseInt(shopsQuery.rows[0].count, 10),
      totalOrders: parseInt(ordersQuery.rows[0].count, 10),
      activeOrders: parseInt(activeOrdersQuery.rows[0].count, 10),
      totalRevenue: revenueQuery.rows[0].sum ? parseFloat(revenueQuery.rows[0].sum) : 0,
    },
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT id, name, email, phone, role, avatar_url, is_active, is_available, current_zone, created_at FROM users ORDER BY created_at DESC");

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

const getAllShops = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone 
     FROM shops s JOIN users u ON s.owner_id = u.id ORDER BY s.created_at DESC`
  );

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  if (typeof req.body.isActive === "undefined") {
    res.status(400);
    throw new Error("isActive is required.");
  }

  const result = await pool.query("UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, role, is_active", [req.body.isActive, req.params.id]);

  if (result.rows.length === 0) {
    res.status(404);
    throw new Error("User not found.");
  }

  res.status(200).json({
    success: true,
    message: "User status updated successfully.",
    data: result.rows[0],
  });
});

module.exports = {
  getDashboardSummary,
  getAllUsers,
  getAllShops,
  updateUserStatus,
};
