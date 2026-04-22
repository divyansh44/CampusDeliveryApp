const { body, param, query } = require("express-validator");

const deliveryModes = ["pickup", "campus_delivery"];
const statuses = ["pending", "preparing", "ready", "picked_up", "delivered", "cancelled"];

const placeOrderValidator = [
  body("shopId").isUUID().withMessage("shopId must be a valid UUID."),
  body("deliveryMode")
    .isIn(deliveryModes)
    .withMessage("deliveryMode must be pickup or campus_delivery."),
  body("items").isArray({ min: 1 }).withMessage("items must contain at least one item."),
  body("items.*.menuItemId").isUUID().withMessage("Each menuItemId must be a valid UUID."),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Each quantity must be at least 1."),
];

const orderIdParamValidator = [param("id").isUUID().withMessage("A valid order id is required.")];

const updateOrderStatusValidator = [
  body("status").isIn(statuses).withMessage(`status must be one of: ${statuses.join(", ")}.`),
];

const getAdminOrdersValidator = [
  query("shopId").optional().isUUID().withMessage("shopId must be a valid UUID."),
  query("status").optional().isIn(statuses).withMessage("Invalid status filter."),
];

module.exports = {
  placeOrderValidator,
  orderIdParamValidator,
  updateOrderStatusValidator,
  getAdminOrdersValidator,
};
