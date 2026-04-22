const { pool } = require("../config/db");

const validateDeliveryMode = (shop, deliveryMode) => {
  if (deliveryMode === "pickup" && !shop.pickup_supported) {
    throw new Error("This shop does not support pickup.");
  }
  if (deliveryMode === "campus_delivery" && !shop.delivery_supported) {
    throw new Error("This shop does not support campus delivery.");
  }
};

const getShopOrFail = async (shopId) => {
  const { rows } = await pool.query("SELECT * FROM shops WHERE id = $1", [shopId]);
  if (rows.length === 0) {
    throw new Error("Shop not found.");
  }
  return rows[0];
};

const findAvailableDeliveryPerson = async () => {
  const { rows } = await pool.query("SELECT * FROM users WHERE role = 'delivery' AND is_available = true LIMIT 1");
  return rows[0] || null; // Simplified logic, can be better load balanced
};

module.exports = {
  validateDeliveryMode,
  getShopOrFail,
  findAvailableDeliveryPerson,
};
