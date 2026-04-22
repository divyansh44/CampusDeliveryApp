const { body, param } = require("express-validator");

const createFeedbackValidator = [
  body("orderId").isUUID().withMessage("orderId must be a valid UUID."),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be between 1 and 5."),
];

const shopFeedbackParamValidator = [param("shopId").isUUID().withMessage("shopId must be a valid UUID.")];

module.exports = {
  createFeedbackValidator,
  shopFeedbackParamValidator,
};
