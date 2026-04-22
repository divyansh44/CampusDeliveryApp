const express = require("express");
const {
  createFeedback,
  getShopFeedback,
  getVendorFeedback,
} = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  createFeedbackValidator,
  shopFeedbackParamValidator,
} = require("../validators/feedbackValidators");

const router = express.Router();

router.get("/shop/:shopId", shopFeedbackParamValidator, validateRequest, getShopFeedback);
router.get("/vendor/me", protect, authorize("vendor"), getVendorFeedback);
router.post("/", protect, authorize("student"), createFeedbackValidator, validateRequest, createFeedback);

module.exports = router;
