const { body, param } = require("express-validator");

const deliveryModes = ["pickup", "campus_delivery"];

const addToCartValidator = [
  body("shopId").isUUID().withMessage("shopId must be a valid UUID."),
  body("menuItemId").isUUID().withMessage("menuItemId must be a valid UUID."),
  body("quantity").isInt({ min: 1 }).withMessage("quantity must be at least 1."),
];

const updateCartItemValidator = [
  param("menuItemId").isUUID().withMessage("menuItemId must be a valid UUID."),
  body("quantity").isInt({ min: 1 }).withMessage("quantity must be at least 1."),
];

const cartItemParamValidator = [param("menuItemId").isUUID().withMessage("menuItemId must be a valid UUID.")];

const checkoutCartValidator = [
  body("deliveryMode")
    .isIn(deliveryModes)
    .withMessage("deliveryMode must be pickup or campus_delivery."),
];

module.exports = {
  addToCartValidator,
  updateCartItemValidator,
  cartItemParamValidator,
  checkoutCartValidator,
};
