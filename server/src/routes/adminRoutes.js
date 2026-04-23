const express = require("express");
const {
  getDashboardSummary,
  getAllUsers,
  getAllShops,
  updateUserStatus,
  getReportedOrders,
  resolveOrderIssue,
  getAllFeedback,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { updateUserStatusValidator } = require("../validators/adminValidators");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/summary", getDashboardSummary);
router.get("/users", getAllUsers);
router.get("/shops", getAllShops);
router.patch("/users/:id/status", updateUserStatusValidator, validateRequest, updateUserStatus);

// Issue management
router.get("/reported-orders", getReportedOrders);
router.patch("/orders/:id/resolve", resolveOrderIssue);

// Platform-wide feedback
router.get("/feedback", getAllFeedback);

module.exports = router;
