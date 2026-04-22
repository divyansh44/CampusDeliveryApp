const { body, param, query } = require("express-validator");

const idMessage = "A valid UUID is required.";

const createShopValidator = [
  body("name").trim().notEmpty().withMessage("Shop name is required."),
  body("location").trim().notEmpty().withMessage("Shop location is required."),
  body("contactNumber").optional().isLength({ min: 8 }).withMessage("Contact number is too short."),
];

const shopIdParamValidator = [param("id").isUUID().withMessage(idMessage)];

const menuItemParamValidator = [param("itemId").isUUID().withMessage(idMessage)];

const addMenuItemValidator = [
  body("name").trim().notEmpty().withMessage("Menu item name is required."),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number."),
];

const updateMenuItemValidator = [
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a non-negative number."),
  body("isAvailable").optional().isBoolean().withMessage("isAvailable must be a boolean."),
];

const getAllShopsValidator = [
  query("isOpen").optional().isBoolean().withMessage("isOpen must be true or false."),
];

module.exports = {
  createShopValidator,
  shopIdParamValidator,
  menuItemParamValidator,
  addMenuItemValidator,
  updateMenuItemValidator,
  getAllShopsValidator,
};
