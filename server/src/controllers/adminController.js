const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { emitOrderUpdate } = require("../socket");

const getDashboardSummary = asyncHandler(async (req, res) => {
  const usersQuery = await pool.query("SELECT COUNT(*) FROM users");
  const shopsQuery = await pool.query("SELECT COUNT(*) FROM shops");
  const ordersQuery = await pool.query("SELECT COUNT(*) FROM orders");
  const activeOrdersQuery = await pool.query("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing', 'ready', 'picked_up')");
  const reportedOrdersQuery = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'issue_reported'");
  
  const revenueQuery = await pool.query("SELECT SUM(total_price) FROM orders WHERE status IN ('ready', 'delivered')");

  res.status(200).json({
    success: true,
    data: {
      totalUsers: parseInt(usersQuery.rows[0].count, 10),
      totalShops: parseInt(shopsQuery.rows[0].count, 10),
      totalOrders: parseInt(ordersQuery.rows[0].count, 10),
      activeOrders: parseInt(activeOrdersQuery.rows[0].count, 10),
      reportedIssues: parseInt(reportedOrdersQuery.rows[0].count, 10),
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

// ── Reported Issues (orders with status = issue_reported) ──

const getReportedOrders = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, 
            s.name as shop_name, s.location as shop_location,
            st.name as student_name, st.email as student_email, st.phone as student_phone,
            dp.name as delivery_name, dp.email as delivery_email, dp.phone as delivery_phone,
            COALESCE((SELECT json_agg(row_to_json(oi)) FROM order_items oi WHERE oi.order_id = o.id), '[]') as items
     FROM orders o
     JOIN shops s ON o.shop_id = s.id
     JOIN users st ON o.student_id = st.id
     LEFT JOIN users dp ON o.delivery_person_id = dp.id
     WHERE o.status = 'issue_reported'
     ORDER BY o.updated_at DESC`
  );

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

const resolveOrderIssue = asyncHandler(async (req, res) => {
  const { resolution, refund, banDriver } = req.body;

  if (!resolution || resolution.trim().length < 3) {
    res.status(400);
    throw new Error("A resolution note is required (minimum 3 characters).");
  }

  const orderQuery = await pool.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Order not found.");
  }

  const order = orderQuery.rows[0];

  if (order.status !== "issue_reported") {
    res.status(400);
    throw new Error("This order does not have a pending issue.");
  }

  // Mark order as resolved — revert status to delivered since the food was (attempted to be) delivered
  const updatedOrder = await pool.query(
    `UPDATE orders SET status = 'delivered', issue_description = $1 WHERE id = $2 RETURNING *`,
    [`[RESOLVED] ${resolution.trim()} | Original: ${order.issue_description}`, order.id]
  );

  // Optionally ban the driver
  if (banDriver && order.delivery_person_id) {
    await pool.query("UPDATE users SET is_active = false WHERE id = $1", [order.delivery_person_id]);
  }

  await emitOrderUpdate(order.id);

  res.status(200).json({
    success: true,
    message: `Issue resolved.${banDriver && order.delivery_person_id ? " Driver has been suspended." : ""}${refund ? " Refund approved." : ""}`,
    data: updatedOrder.rows[0],
  });
});

// ── All Feedback (platform-wide) ──

const getAllFeedback = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT f.*, 
            u.name as student_name, u.email as student_email,
            s.name as shop_name
     FROM feedbacks f
     JOIN users u ON f.user_id = u.id
     JOIN shops s ON f.shop_id = s.id
     ORDER BY f.created_at DESC`
  );

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

module.exports = {
  getDashboardSummary,
  getAllUsers,
  getAllShops,
  updateUserStatus,
  getReportedOrders,
  resolveOrderIssue,
  getAllFeedback,
};
