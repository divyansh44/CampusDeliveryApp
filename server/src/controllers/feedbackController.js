const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const createFeedback = asyncHandler(async (req, res) => {
  const { orderId, rating, comment } = req.body;

  if (!orderId || !rating) {
    res.status(400);
    throw new Error("orderId and rating are required.");
  }

  const orderQuery = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Order not found.");
  }
  const order = orderQuery.rows[0];

  if (order.student_id !== req.user.id) {
    res.status(403);
    throw new Error("You can only review your own orders.");
  }

  if (order.status !== "delivered") {
    res.status(400);
    throw new Error("Feedback can only be submitted for delivered orders.");
  }

  const existingFeedback = await pool.query("SELECT * FROM feedbacks WHERE order_id = $1", [orderId]);
  if (existingFeedback.rows.length > 0) {
    res.status(409);
    throw new Error("Feedback has already been submitted for this order.");
  }

  const feedbackResult = await pool.query(
    "INSERT INTO feedbacks (user_id, shop_id, order_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [req.user.id, order.shop_id, order.id, rating, comment || ""]
  );

  res.status(201).json({
    success: true,
    message: "Feedback submitted successfully.",
    data: feedbackResult.rows[0],
  });
});

const getShopFeedback = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT f.*, u.name as student_name FROM feedbacks f JOIN users u ON f.user_id = u.id WHERE f.shop_id = $1 ORDER BY f.created_at DESC",
    [req.params.shopId]
  );

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

const getVendorFeedback = asyncHandler(async (req, res) => {
  const shopQuery = await pool.query("SELECT id FROM shops WHERE owner_id = $1", [req.user.id]);
  if (shopQuery.rows.length === 0) {
    res.status(404);
    throw new Error("No shop found for this vendor.");
  }
  const shopId = shopQuery.rows[0].id;

  const { rows } = await pool.query(
    "SELECT f.*, u.name as student_name, u.email as student_email FROM feedbacks f JOIN users u ON f.user_id = u.id WHERE f.shop_id = $1 ORDER BY f.created_at DESC",
    [shopId]
  );

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

module.exports = {
  createFeedback,
  getShopFeedback,
  getVendorFeedback,
};
