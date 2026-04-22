const express = require("express");
const { registerUser, loginUser, googleLogin, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { registerValidator, loginValidator, googleLoginValidator } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validateRequest, registerUser);
router.post("/login", loginValidator, validateRequest, loginUser);
router.post("/google", googleLoginValidator, validateRequest, googleLogin);
router.get("/me", protect, getProfile);

module.exports = router;
