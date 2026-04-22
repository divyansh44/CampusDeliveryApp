const express = require("express");
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  updateOrderStatus,
  cancelMyOrder,
  getAdminOrders,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  placeOrderValidator,
  orderIdParamValidator,
  updateOrderStatusValidator,
  getAdminOrdersValidator,
} = require("../validators/orderValidators");

const router = express.Router();

router.post("/", protect, authorize("student"), placeOrderValidator, validateRequest, placeOrder);
router.get("/my-orders", protect, authorize("student"), getMyOrders);
router.patch("/:id/cancel", protect, authorize("student"), orderIdParamValidator, validateRequest, cancelMyOrder);

router.get("/vendor", protect, authorize("vendor"), getVendorOrders);
router.patch(
  "/:id/status",
  protect,
  authorize("vendor", "admin", "student", "delivery"),
  orderIdParamValidator,
  updateOrderStatusValidator,
  validateRequest,
  updateOrderStatus
);

router.get("/admin", protect, authorize("admin"), getAdminOrdersValidator, validateRequest, getAdminOrders);
router.get("/:id", protect, orderIdParamValidator, validateRequest, getOrderById);

module.exports = router;
