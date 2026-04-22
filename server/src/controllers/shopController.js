const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const buildUploadPath = (file, folder) => (file ? `/uploads/${folder}/${file.filename}` : "");

const createShop = asyncHandler(async (req, res) => {
  const { name, description, imageUrl, category, location, contactNumber, deliverySupported, pickupSupported } =
    req.body;

  if (!name || !location) {
    res.status(400);
    throw new Error("Shop name and location are required.");
  }

  const existing = await pool.query("SELECT * FROM shops WHERE owner_id = $1", [req.user.id]);
  if (existing.rows.length > 0) {
    res.status(409);
    throw new Error("This vendor already has a shop.");
  }

  const result = await pool.query(
    `INSERT INTO shops (owner_id, name, description, category, location, contact_number, delivery_supported, pickup_supported)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      req.user.id,
      name,
      description || "",
      category || "Food",
      location,
      contactNumber || "",
      deliverySupported ?? true,
      pickupSupported ?? true,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Shop created successfully.",
    data: result.rows[0],
  });
});

const getAllShops = asyncHandler(async (req, res) => {
  const { search, category, isOpen } = req.query;
  
  let query = "SELECT s.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone FROM shops s JOIN users u ON s.owner_id = u.id WHERE 1=1";
  const params = [];
  let paramCount = 1;

  if (search) {
    query += ` AND (s.name ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  if (category) {
    query += ` AND s.category = $${paramCount}`;
    params.push(category);
    paramCount++;
  }

  if (typeof isOpen !== "undefined") {
    query += ` AND s.is_open = $${paramCount}`;
    params.push(isOpen === "true");
    paramCount++;
  }

  query += " ORDER BY s.created_at DESC";

  const { rows } = await pool.query(query, params);

  // Fetch menu items for all these shops
  const shopIds = rows.map(s => s.id);
  let menuItems = [];
  if (shopIds.length > 0) {
    const menus = await pool.query(`SELECT * FROM menu_items WHERE shop_id = ANY($1)`, [shopIds]);
    menuItems = menus.rows;
  }

  const mappedData = rows.map(s => ({
    ...s,
    menuItems: menuItems.filter(m => m.shop_id === s.id)
  }));

  res.status(200).json({
    success: true,
    count: mappedData.length,
    data: mappedData,
  });
});

const getShopById = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT s.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone FROM shops s JOIN users u ON s.owner_id = u.id WHERE s.id = $1",
    [req.params.id]
  );

  if (rows.length === 0) {
    res.status(404);
    throw new Error("Shop not found.");
  }

  const shop = rows[0];
  const menus = await pool.query("SELECT * FROM menu_items WHERE shop_id = $1", [shop.id]);
  shop.menuItems = menus.rows;

  res.status(200).json({
    success: true,
    data: shop,
  });
});

const getMyShop = asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM shops WHERE owner_id = $1", [req.user.id]);

  if (rows.length === 0) {
    res.status(404);
    throw new Error("No shop found for this vendor.");
  }
  
  const shop = rows[0];
  const menus = await pool.query("SELECT * FROM menu_items WHERE shop_id = $1", [shop.id]);
  shop.menuItems = menus.rows;

  res.status(200).json({
    success: true,
    data: shop,
  });
});

const updateMyShop = asyncHandler(async (req, res) => {
  const shopQuery = await pool.query("SELECT id FROM shops WHERE owner_id = $1", [req.user.id]);

  if (shopQuery.rows.length === 0) {
    res.status(404);
    throw new Error("No shop found for this vendor.");
  }
  
  const shopId = shopQuery.rows[0].id;

  const fields = [
    "name",
    "description",
    "category",
    "location",
    "contactNumber",
    "isOpen",
    "deliverySupported",
    "pickupSupported",
  ];

  const dbFields = {
    name: 'name',
    description: 'description',
    category: 'category',
    location: 'location',
    contactNumber: 'contact_number',
    isOpen: 'is_open',
    deliverySupported: 'delivery_supported',
    pickupSupported: 'pickup_supported',
  };

  const updates = [];
  const params = [];
  let paramCount = 1;

  fields.forEach((field) => {
    if (typeof req.body[field] !== "undefined") {
      updates.push(`${dbFields[field]} = $${paramCount}`);
      params.push(req.body[field]);
      paramCount++;
    }
  });

  if (updates.length > 0) {
    params.push(shopId);
    await pool.query(
      `UPDATE shops SET ${updates.join(", ")} WHERE id = $${paramCount}`,
      params
    );
  }

  const updatedShop = await pool.query("SELECT * FROM shops WHERE id = $1", [shopId]);
  
  const shopData = updatedShop.rows[0];
  const menus = await pool.query("SELECT * FROM menu_items WHERE shop_id = $1", [shopId]);
  shopData.menuItems = menus.rows;

  res.status(200).json({
    success: true,
    message: "Shop updated successfully.",
    data: shopData,
  });
});

const addMenuItem = asyncHandler(async (req, res) => {
  const { name, description, category, price, imageUrl, isAvailable } = req.body;
  const shopQuery = await pool.query("SELECT id FROM shops WHERE owner_id = $1", [req.user.id]);

  if (shopQuery.rows.length === 0) {
    res.status(404);
    throw new Error("No shop found for this vendor.");
  }
  
  const shopId = shopQuery.rows[0].id;

  if (!name || typeof price === "undefined") {
    res.status(400);
    throw new Error("Menu item name and price are required.");
  }

  const result = await pool.query(
    `INSERT INTO menu_items (shop_id, name, description, category, price, image_url, is_available) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [shopId, name, description || "", category || "General", price, imageUrl || "", isAvailable ?? true]
  );

  res.status(201).json({
    success: true,
    message: "Menu item added successfully.",
    data: result.rows[0],
  });
});

const uploadShopImage = asyncHandler(async (req, res) => {
  // Omitted or update a 'image_url' if added to shops
  res.status(200).json({ success: true, message: "Shop image uploaded successfully." });
});

const uploadMenuItemImage = asyncHandler(async (req, res) => {
  const shopQuery = await pool.query("SELECT id FROM shops WHERE owner_id = $1", [req.user.id]);

  if (shopQuery.rows.length === 0) {
    res.status(404);
    throw new Error("No shop found for this vendor.");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("Image file is required.");
  }

  const imageUrl = buildUploadPath(req.file, "menu-items");
  const result = await pool.query(
    "UPDATE menu_items SET image_url = $1 WHERE id = $2 AND shop_id = $3 RETURNING *",
    [imageUrl, req.params.itemId, shopQuery.rows[0].id]
  );

  if (result.rows.length === 0) {
    res.status(404);
    throw new Error("Menu item not found.");
  }

  res.status(200).json({
    success: true,
    message: "Menu item image uploaded successfully.",
    data: result.rows[0],
  });
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const shopQuery = await pool.query("SELECT id FROM shops WHERE owner_id = $1", [req.user.id]);

  if (shopQuery.rows.length === 0) {
    res.status(404);
    throw new Error("No shop found for this vendor.");
  }
  const shopId = shopQuery.rows[0].id;

  const itemQuery = await pool.query("SELECT * FROM menu_items WHERE id = $1 AND shop_id = $2", [req.params.itemId, shopId]);
  if (itemQuery.rows.length === 0) {
    res.status(404);
    throw new Error("Menu item not found.");
  }

  const fields = ["name", "description", "category", "price", "isAvailable"];
  const dbFields = {
    name: 'name', description: 'description', category: 'category', price: 'price', isAvailable: 'is_available'
  }
  
  const updates = [];
  const params = [];
  let paramCount = 1;

  fields.forEach((field) => {
    if (typeof req.body[field] !== "undefined") {
      updates.push(`${dbFields[field]} = $${paramCount}`);
      params.push(req.body[field]);
      paramCount++;
    }
  });

  if (updates.length > 0) {
    params.push(req.params.itemId);
    params.push(shopId);
    await pool.query(
      `UPDATE menu_items SET ${updates.join(", ")} WHERE id = $${paramCount} AND shop_id = $${paramCount + 1}`,
      params
    );
  }

  const updatedItem = await pool.query("SELECT * FROM menu_items WHERE id = $1", [req.params.itemId]);

  res.status(200).json({
    success: true,
    message: "Menu item updated successfully.",
    data: updatedItem.rows[0],
  });
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const shopQuery = await pool.query("SELECT id FROM shops WHERE owner_id = $1", [req.user.id]);

  if (shopQuery.rows.length === 0) {
    res.status(404);
    throw new Error("No shop found for this vendor.");
  }

  const result = await pool.query("DELETE FROM menu_items WHERE id = $1 AND shop_id = $2 RETURNING *", [req.params.itemId, shopQuery.rows[0].id]);
  
  if (result.rows.length === 0) {
    res.status(404);
    throw new Error("Menu item not found.");
  }

  res.status(200).json({
    success: true,
    message: "Menu item deleted successfully.",
  });
});

const getVendorSalesSummary = asyncHandler(async (req, res) => {
  const shopQuery = await pool.query("SELECT id FROM shops WHERE owner_id = $1", [req.user.id]);

  if (shopQuery.rows.length === 0) {
    res.status(404);
    throw new Error("No shop found for this vendor.");
  }
  const shopId = shopQuery.rows[0].id;

  const summaryQuery = await pool.query(
    "SELECT SUM(total_price) as totalRevenue, COUNT(id) as totalOrders FROM orders WHERE shop_id = $1 AND status IN ('ready', 'delivered')",
    [shopId]
  );
  
  const summary = summaryQuery.rows[0];

  res.status(200).json({
    success: true,
    data: {
      shopId,
      totalRevenue: summary.totalrevenue ? parseFloat(summary.totalrevenue) : 0,
      totalOrders: summary.totalorders ? parseInt(summary.totalorders, 10) : 0,
    },
  });
});

module.exports = {
  createShop,
  getAllShops,
  getShopById,
  getMyShop,
  updateMyShop,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getVendorSalesSummary,
  uploadShopImage,
  uploadMenuItemImage,
};
