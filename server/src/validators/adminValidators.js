const { body, param } = require("express-validator");

const updateUserStatusValidator = [
  param("id").isUUID().withMessage("A valid user id is required."),
  body("isActive").isBoolean().withMessage("isActive must be true or false."),
];

module.exports = {
  updateUserStatusValidator,
};
