const { body } = require("express-validator");

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("A valid email is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  body("role")
    .optional()
    .isIn(["student", "vendor", "delivery"])
    .withMessage("Role must be student, vendor, or delivery."),
];

const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

const googleLoginValidator = [
  body("credential").notEmpty().withMessage("Google credential is required."),
  body("role")
    .optional()
    .isIn(["student", "vendor", "delivery"])
    .withMessage("Role must be student, vendor, or delivery."),
];

module.exports = {
  registerValidator,
  loginValidator,
  googleLoginValidator,
};
