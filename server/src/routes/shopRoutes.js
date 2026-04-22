const express = require("express");
const {
  createShop,
  getAllShops,
  getShopById,
  getMyShop,
  updateMyShop,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getVendorSalesSummary,
} = require("../controllers/shopController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { upload } = require("../middleware/uploadMiddleware");
const {
  createShopValidator,
  shopIdParamValidator,
  menuItemParamValidator,
  addMenuItemValidator,
  updateMenuItemValidator,
  getAllShopsValidator,
} = require("../validators/shopValidators");
const { uploadShopImage, uploadMenuItemImage } = require("../controllers/shopController");

const router = express.Router();

router.get("/", getAllShopsValidator, validateRequest, getAllShops);
router.get("/vendor/me", protect, authorize("vendor"), getMyShop);
router.get("/vendor/me/summary", protect, authorize("vendor"), getVendorSalesSummary);
router.get("/:id", shopIdParamValidator, validateRequest, getShopById);

router.post("/", protect, authorize("vendor"), createShopValidator, validateRequest, createShop);
router.patch("/vendor/me", protect, authorize("vendor"), updateMyShop);
router.post(
  "/vendor/me/menu",
  protect,
  authorize("vendor"),
  addMenuItemValidator,
  validateRequest,
  addMenuItem
);
router.patch("/vendor/me/image", protect, authorize("vendor"), upload.single("image"), uploadShopImage);
router.patch(
  "/vendor/me/menu/:itemId",
  protect,
  authorize("vendor"),
  menuItemParamValidator,
  updateMenuItemValidator,
  validateRequest,
  updateMenuItem
);
router.patch(
  "/vendor/me/menu/:itemId/image",
  protect,
  authorize("vendor"),
  menuItemParamValidator,
  validateRequest,
  upload.single("image"),
  uploadMenuItemImage
);
router.delete(
  "/vendor/me/menu/:itemId",
  protect,
  authorize("vendor"),
  menuItemParamValidator,
  validateRequest,
  deleteMenuItem
);

module.exports = router;
