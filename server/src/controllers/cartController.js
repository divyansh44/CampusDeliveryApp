const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { validateDeliveryMode, getShopOrFail, findAvailableDeliveryPerson } = require("../utils/orderUtils");
const { emitOrderUpdate } = require("../socket");

const recalculateCart = (items) => {
  return items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
};

const getMyCart = asyncHandler(async (req, res) => {
  const cartQuery = await pool.query(
    "SELECT c.*, s.name as shop_name, s.location as shop_location FROM carts c LEFT JOIN shops s ON c.shop_id = s.id WHERE c.student_id = $1",
    [req.user.id]
  );

  if (cartQuery.rows.length === 0) {
    return res.status(200).json({ success: true, data: null });
  }

  const cart = cartQuery.rows[0];
  const itemsQuery = await pool.query("SELECT * FROM cart_items WHERE cart_id = $1", [cart.id]);
  cart.items = itemsQuery.rows;

  res.status(200).json({
    success: true,
    data: cart,
  });
});

const addToCart = asyncHandler(async (req, res) => {
  const { shopId, menuItemId, quantity } = req.body;

  if (!shopId || !menuItemId || !quantity) {
    res.status(400);
    throw new Error("shopId, menuItemId, and quantity are required.");
  }

  const shop = await getShopOrFail(shopId);

  const itemQuery = await pool.query("SELECT * FROM menu_items WHERE id = $1 AND shop_id = $2", [menuItemId, shopId]);
  if (itemQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Menu item not found in this shop.");
  }
  const menuItem = itemQuery.rows[0];
  const subtotal = menuItem.price * Number(quantity);

  let cartQuery = await pool.query("SELECT * FROM carts WHERE student_id = $1", [req.user.id]);
  let cart;

  if (cartQuery.rows.length === 0) {
    const newCart = await pool.query(
      "INSERT INTO carts (student_id, shop_id, total_price) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, shop.id, subtotal]
    );
    cart = newCart.rows[0];

    await pool.query(
      "INSERT INTO cart_items (cart_id, menu_item_id, name, price, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6)",
      [cart.id, menuItem.id, menuItem.name, menuItem.price, quantity, subtotal]
    );
  } else {
    cart = cartQuery.rows[0];
    if (cart.shop_id !== shopId) {
      res.status(400);
      throw new Error("Your cart can only contain items from one shop at a time.");
    }

    const existingItemQuery = await pool.query("SELECT * FROM cart_items WHERE cart_id = $1 AND menu_item_id = $2", [cart.id, menuItem.id]);
    
    if (existingItemQuery.rows.length > 0) {
      const existing = existingItemQuery.rows[0];
      const newQty = existing.quantity + Number(quantity);
      const newSub = newQty * menuItem.price;
      await pool.query(
        "UPDATE cart_items SET quantity = $1, subtotal = $2 WHERE id = $3",
        [newQty, newSub, existing.id]
      );
    } else {
      await pool.query(
        "INSERT INTO cart_items (cart_id, menu_item_id, name, price, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6)",
        [cart.id, menuItem.id, menuItem.name, menuItem.price, quantity, subtotal]
      );
    }

    const updatedItems = await pool.query("SELECT * FROM cart_items WHERE cart_id = $1", [cart.id]);
    const newTotal = recalculateCart(updatedItems.rows);
    await pool.query("UPDATE carts SET total_price = $1 WHERE id = $2", [newTotal, cart.id]);
  }

  const finalCart = await pool.query(
    "SELECT c.*, s.name as shop_name, s.location as shop_location FROM carts c JOIN shops s ON c.shop_id = s.id WHERE c.student_id = $1",
    [req.user.id]
  );
  const cartData = finalCart.rows[0];
  const itemsData = await pool.query("SELECT * FROM cart_items WHERE cart_id = $1", [cartData.id]);
  cartData.items = itemsData.rows;

  res.status(200).json({
    success: true,
    message: "Item added to cart.",
    data: cartData,
  });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { menuItemId } = req.params;

  if (!quantity || quantity < 1) {
    res.status(400);
    throw new Error("A valid quantity greater than 0 is required.");
  }

  const cartQuery = await pool.query("SELECT * FROM carts WHERE student_id = $1", [req.user.id]);
  if (cartQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Cart not found.");
  }
  const cart = cartQuery.rows[0];

  const itemQuery = await pool.query("SELECT * FROM cart_items WHERE cart_id = $1 AND menu_item_id = $2", [cart.id, menuItemId]);
  if (itemQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Item not found in cart.");
  }
  const item = itemQuery.rows[0];

  const newSubtotal = item.price * Number(quantity);
  await pool.query("UPDATE cart_items SET quantity = $1, subtotal = $2 WHERE id = $3", [quantity, newSubtotal, item.id]);

  const updatedItems = await pool.query("SELECT * FROM cart_items WHERE cart_id = $1", [cart.id]);
  const newTotal = recalculateCart(updatedItems.rows);
  await pool.query("UPDATE carts SET total_price = $1 WHERE id = $2", [newTotal, cart.id]);

  const cartData = { ...cart, total_price: newTotal, items: updatedItems.rows };

  res.status(200).json({
    success: true,
    message: "Cart item updated.",
    data: cartData,
  });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cartQuery = await pool.query("SELECT * FROM carts WHERE student_id = $1", [req.user.id]);
  if (cartQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Cart not found.");
  }
  const cart = cartQuery.rows[0];

  await pool.query("DELETE FROM cart_items WHERE cart_id = $1 AND menu_item_id = $2", [cart.id, req.params.menuItemId]);

  const updatedItems = await pool.query("SELECT * FROM cart_items WHERE cart_id = $1", [cart.id]);

  if (updatedItems.rows.length === 0) {
    await pool.query("DELETE FROM carts WHERE id = $1", [cart.id]);
    return res.status(200).json({
      success: true,
      message: "Item removed and cart deleted because it became empty.",
    });
  }

  const newTotal = recalculateCart(updatedItems.rows);
  await pool.query("UPDATE carts SET total_price = $1 WHERE id = $2", [newTotal, cart.id]);

  res.status(200).json({
    success: true,
    message: "Item removed from cart.",
    data: { ...cart, total_price: newTotal, items: updatedItems.rows },
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const cartQuery = await pool.query("SELECT * FROM carts WHERE student_id = $1", [req.user.id]);
  if (cartQuery.rows.length > 0) {
    await pool.query("DELETE FROM carts WHERE student_id = $1", [req.user.id]);
  }

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully.",
  });
});

const checkoutCart = asyncHandler(async (req, res) => {
  const { deliveryMode, deliveryAddress, notes } = req.body;

  if (!deliveryMode) {
    res.status(400);
    throw new Error("deliveryMode is required.");
  }

  const cartQuery = await pool.query("SELECT * FROM carts WHERE student_id = $1", [req.user.id]);
  if (cartQuery.rows.length === 0) {
    res.status(400);
    throw new Error("Cart is empty.");
  }
  const cart = cartQuery.rows[0];
  
  const itemsQuery = await pool.query("SELECT * FROM cart_items WHERE cart_id = $1", [cart.id]);
  if (itemsQuery.rows.length === 0) {
    res.status(400);
    throw new Error("Cart is empty.");
  }
  const cartItems = itemsQuery.rows;

  const shop = await getShopOrFail(cart.shop_id);
  validateDeliveryMode(shop, deliveryMode);

  // Orders enter a pool and drivers pick them when they become 'ready'
  const deliveryPerson = null;
  const assignedAt = null;

  const orderResult = await pool.query(
    `INSERT INTO orders (student_id, shop_id, delivery_mode, delivery_address, total_price, delivery_person_id, assigned_at, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [req.user.id, shop.id, deliveryMode, deliveryAddress || "", cart.total_price, deliveryPerson, assignedAt, notes || ""]
  );

  const order = orderResult.rows[0];

  for (const oi of cartItems) {
    await pool.query(
      `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [order.id, oi.menu_item_id, oi.name, oi.price, oi.quantity, oi.subtotal]
    );
  }

  await pool.query("DELETE FROM carts WHERE id = $1", [cart.id]);

  await emitOrderUpdate(order.id);

  res.status(201).json({
    success: true,
    message: "Order placed from cart successfully.",
    data: order,
  });
});

module.exports = {
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkoutCart,
};
