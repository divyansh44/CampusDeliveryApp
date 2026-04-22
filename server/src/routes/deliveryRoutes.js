const express = require("express");
const {
  getDeliveryProfile,
  getMyDeliveries,
  getAvailableDeliveries,
  acceptDelivery,
  updateAvailability,
} = require("../controllers/deliveryController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { body } = require("express-validator");

const router = express.Router();

router.use(protect, authorize("delivery"));

router.get("/me", getDeliveryProfile);
router.get("/orders", getMyDeliveries);
router.get("/available", getAvailableDeliveries);
router.post("/orders/:orderId/accept", acceptDelivery);
router.patch(
  "/me/availability",
  [
    body("isAvailable").optional().isBoolean().withMessage("isAvailable must be true or false."),
    body("currentZone").optional().isString().withMessage("currentZone must be a string."),
  ],
  validateRequest,
  updateAvailability
);

module.exports = router;
