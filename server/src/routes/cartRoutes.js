const express = require("express");
const {
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkoutCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  addToCartValidator,
  updateCartItemValidator,
  cartItemParamValidator,
  checkoutCartValidator,
} = require("../validators/cartValidators");

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/", getMyCart);
router.post("/", addToCartValidator, validateRequest, addToCart);
router.patch("/items/:menuItemId", updateCartItemValidator, validateRequest, updateCartItem);
router.delete("/items/:menuItemId", cartItemParamValidator, validateRequest, removeCartItem);
router.delete("/", clearCart);
router.post("/checkout", checkoutCartValidator, validateRequest, checkoutCart);

module.exports = router;
