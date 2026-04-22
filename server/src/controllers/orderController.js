const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { validateDeliveryMode, getShopOrFail, findAvailableDeliveryPerson } = require("../utils/orderUtils");
const { emitOrderUpdate } = require("../socket");

const placeOrder = asyncHandler(async (req, res) => {
  const { shopId, items, deliveryMode, deliveryAddress, notes } = req.body;

  if (!shopId || !Array.isArray(items) || items.length === 0 || !deliveryMode) {
    res.status(400);
    throw new Error("shopId, items, and deliveryMode are required.");
  }

  const shop = await getShopOrFail(shopId);
  validateDeliveryMode(shop, deliveryMode);

  let totalPrice = 0;
  const orderItems = [];

  for (const item of items) {
    const itemQuery = await pool.query("SELECT * FROM menu_items WHERE id = $1 AND shop_id = $2", [item.menuItem, shopId]);
    if (itemQuery.rows.length === 0) {
      res.status(400);
      throw new Error(`Menu item ${item.menuItem} not found in this shop.`);
    }
    const menuItem = itemQuery.rows[0];
    const subtotal = menuItem.price * item.quantity;
    totalPrice += subtotal;
    
    orderItems.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity,
      subtotal
    });
  }

  // Orders are no longer automatically assigned; they enter a driver pool when marked 'ready'
  const deliveryPerson = null;
  const assignedAt = null;

  const orderResult = await pool.query(
    `INSERT INTO orders (student_id, shop_id, delivery_mode, delivery_address, total_price, delivery_person_id, assigned_at, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [req.user.id, shopId, deliveryMode, deliveryAddress || "", totalPrice, deliveryPerson, assignedAt, notes || ""]
  );

  const order = orderResult.rows[0];

  for (const oi of orderItems) {
    await pool.query(
      `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [order.id, oi.menu_item_id, oi.name, oi.price, oi.quantity, oi.subtotal]
    );
  }

  // Populate data for return
  order.items = orderItems;
  order.shop = shop;
  
  await emitOrderUpdate(order.id);

  res.status(201).json({
    success: true,
    message: "Order placed successfully.",
    data: order,
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, s.name as shop_name, s.location as shop_location, 
            dp.name as delivery_person_name, dp.phone as delivery_person_phone,
            COALESCE((SELECT json_agg(row_to_json(oi)) FROM order_items oi WHERE oi.order_id = o.id), '[]') as items
     FROM orders o 
     JOIN shops s ON o.shop_id = s.id 
     LEFT JOIN users dp ON o.delivery_person_id = dp.id 
     WHERE o.student_id = $1 ORDER BY o.created_at DESC`,
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const orderQuery = await pool.query(
    `SELECT o.*, 
            s.name as shop_name, s.location as shop_location, s.owner_id as shop_owner_id,
            st.name as student_name, st.email as student_email, st.phone as student_phone,
            dp.name as delivery_name, dp.phone as delivery_phone, dp.role as delivery_role, dp.current_zone as delivery_zone, dp.is_available as delivery_is_available
     FROM orders o
     JOIN shops s ON o.shop_id = s.id
     JOIN users st ON o.student_id = st.id
     LEFT JOIN users dp ON o.delivery_person_id = dp.id
     WHERE o.id = $1`,
    [req.params.id]
  );

  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Order not found.");
  }
  
  const order = orderQuery.rows[0];

  const isStudentOwner = order.student_id === req.user.id;
  const isVendorOwner = order.shop_owner_id === req.user.id;
  const isAssignedDelivery = order.delivery_person_id === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isStudentOwner && !isVendorOwner && !isAssignedDelivery && !isAdmin) {
    res.status(403);
    throw new Error("You are not allowed to view this order.");
  }

  const itemsQuery = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
  order.items = itemsQuery.rows;

  res.status(200).json({
    success: true,
    data: order,
  });
});

const getVendorOrders = asyncHandler(async (req, res) => {
  const shopQuery = await pool.query("SELECT id FROM shops WHERE owner_id = $1", [req.user.id]);

  if (shopQuery.rows.length === 0) {
    res.status(404);
    throw new Error("No shop found for this vendor.");
  }
  const shopId = shopQuery.rows[0].id;

  let query = `SELECT o.*, st.name as student_name, st.phone as student_phone, dp.name as delivery_name, dp.phone as delivery_phone,
               COALESCE((SELECT json_agg(row_to_json(oi)) FROM order_items oi WHERE oi.order_id = o.id), '[]') as items
               FROM orders o JOIN users st ON o.student_id = st.id LEFT JOIN users dp ON o.delivery_person_id = dp.id 
               WHERE o.shop_id = $1`;
  const params = [shopId];

  if (req.query.status) {
    query += ` AND o.status = $2`;
    params.push(req.query.status);
  }

  query += ` ORDER BY o.created_at DESC`;

  const { rows } = await pool.query(query, params);

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["pending", "preparing", "ready", "picked_up", "delivered", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid order status.");
  }

  const orderQuery = await pool.query("SELECT o.*, s.owner_id as shop_owner_id FROM orders o JOIN shops s ON o.shop_id = s.id WHERE o.id = $1", [req.params.id]);
  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Order not found.");
  }

  const order = orderQuery.rows[0];

  if (req.user.role === "vendor" && order.shop_owner_id !== req.user.id) {
    res.status(403);
    throw new Error("You are not allowed to update this order.");
  }

  if (req.user.role === "student" && order.student_id !== req.user.id) {
    res.status(403);
    throw new Error("You are not allowed to update this order.");
  }

  if (req.user.role === "student" && status !== "cancelled") {
    res.status(403);
    throw new Error("Students can only cancel their orders.");
  }

  if (req.user.role === "delivery") {
    if (!order.delivery_person_id || order.delivery_person_id !== req.user.id) {
      res.status(403);
      throw new Error("This order is not assigned to you.");
    }
    if (!["picked_up", "delivered"].includes(status)) {
      res.status(403);
      throw new Error("Delivery personnel can only mark orders as picked_up or delivered.");
    }
  }

  if (req.user.role === "vendor" && order.delivery_mode === "campus_delivery" && status === "delivered") {
    res.status(403);
    throw new Error("Campus delivery orders must be completed by the assigned driver.");
  }

  let updates = "status = $1";
  const params = [status, order.id];
  let paramCount = 3;

  if (status === "picked_up") {
    updates += `, picked_up_at = $${paramCount}`;
    params.push(new Date());
    paramCount++;
  }

  if (status === "delivered") {
    updates += `, delivered_at = $${paramCount}`;
    params.push(new Date());
  }

  const updatedOrder = await pool.query(`UPDATE orders SET ${updates} WHERE id = $2 RETURNING *`, params);

  await emitOrderUpdate(order.id);

  res.status(200).json({
    success: true,
    message: "Order status updated successfully.",
    data: updatedOrder.rows[0],
  });
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  const orderQuery = await pool.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);

  if (orderQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Order not found.");
  }
  
  const order = orderQuery.rows[0];

  if (order.student_id !== req.user.id) {
    res.status(403);
    throw new Error("You are not allowed to cancel this order.");
  }

  if (!["pending", "preparing"].includes(order.status)) {
    res.status(400);
    throw new Error("This order can no longer be cancelled.");
  }

  const updatedOrder = await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *", [order.id]);
  await emitOrderUpdate(order.id);

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully.",
    data: updatedOrder.rows[0],
  });
});

const getAdminOrders = asyncHandler(async (req, res) => {
  let query = `SELECT o.*, s.name as shop_name, s.location as shop_location, 
               st.name as student_name, st.email as student_email,
               dp.name as delivery_name, dp.phone as delivery_phone,
               COALESCE((SELECT json_agg(row_to_json(oi)) FROM order_items oi WHERE oi.order_id = o.id), '[]') as items
               FROM orders o 
               JOIN shops s ON o.shop_id = s.id 
               JOIN users st ON o.student_id = st.id 
               LEFT JOIN users dp ON o.delivery_person_id = dp.id 
               WHERE 1=1`;
  const params = [];
  let paramCount = 1;

  if (req.query.status) {
    query += ` AND o.status = $${paramCount}`;
    params.push(req.query.status);
    paramCount++;
  }
  if (req.query.shopId) {
    query += ` AND o.shop_id = $${paramCount}`;
    params.push(req.query.shopId);
    paramCount++;
  }

  query += ` ORDER BY o.created_at DESC`;

  const { rows } = await pool.query(query, params);

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  });
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  updateOrderStatus,
  cancelMyOrder,
  getAdminOrders,
};
