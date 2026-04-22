const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const getDeliveryProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

const getMyDeliveries = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, st.name as student_name, st.phone as student_phone, st.email as student_email,
            s.name as shop_name, s.location as shop_location,
            COALESCE((SELECT json_agg(row_to_json(oi)) FROM order_items oi WHERE oi.order_id = o.id), '[]') as items
     FROM orders o 
     JOIN users st ON o.student_id = st.id
     JOIN shops s ON o.shop_id = s.id
     WHERE o.delivery_person_id = $1 AND o.status != 'delivered' AND o.status != 'cancelled'
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

const getAvailableDeliveries = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, st.name as student_name, st.phone as student_phone, st.email as student_email,
            s.name as shop_name, s.location as shop_location,
            COALESCE((SELECT json_agg(row_to_json(oi)) FROM order_items oi WHERE oi.order_id = o.id), '[]') as items
     FROM orders o 
     JOIN users st ON o.student_id = st.id
     JOIN shops s ON o.shop_id = s.id
     WHERE o.status = 'ready' 
       AND o.delivery_mode = 'campus_delivery' 
       AND o.delivery_person_id IS NULL
     ORDER BY o.created_at ASC`
  );

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

const acceptDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // We must ensure the order is actually available and unassigned to prevent race conditions
  const orderQuery = await pool.query(
     "SELECT * FROM orders WHERE id = $1 AND status = 'ready' AND delivery_mode = 'campus_delivery'", 
     [orderId]
  );

  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Order not found or no longer available.");
  }

  const order = orderQuery.rows[0];

  if (order.delivery_person_id) {
    res.status(400);
    throw new Error("This order has already been accepted by another driver.");
  }

  // Atomic update
  const result = await pool.query(
    `UPDATE orders SET delivery_person_id = $1, assigned_at = $2 WHERE id = $3 AND delivery_person_id IS NULL RETURNING *`,
    [req.user.id, new Date(), orderId]
  );

  if (result.rows.length === 0) {
     res.status(400);
     throw new Error("Failed to accept delivery. It may have just been claimed.");
  }

  // Socket notification can be handled
  const { emitOrderUpdate } = require("../socket");
  await emitOrderUpdate(orderId);

  res.status(200).json({
    success: true,
    message: "Delivery accepted successfully.",
    data: result.rows[0]
  });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const { isAvailable, currentZone } = req.body;

  let updates = [];
  let params = [];
  let paramCount = 1;

  if (typeof isAvailable !== "undefined") {
    updates.push(`is_available = $${paramCount}`);
    params.push(isAvailable);
    paramCount++;
  }

  if (typeof currentZone !== "undefined") {
    updates.push(`current_zone = $${paramCount}`);
    params.push(currentZone);
    paramCount++;
  }

  if (updates.length > 0) {
    params.push(req.user.id);
    const result = await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`, params);
    
    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }
  }

  res.status(200).json({
    success: true,
    message: "Delivery availability updated.",
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isAvailable: req.user.is_available,
      currentZone: req.user.current_zone,
    },
  });
});

module.exports = {
  getDeliveryProfile,
  getMyDeliveries,
  getAvailableDeliveries,
  acceptDelivery,
  updateAvailability,
};
