const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.JWT_SECRET = "test-secret";
process.env.MONGODB_URI = "";

const app = require("../src/app");
const { connectDB, disconnectDB } = require("../src/config/db");

test.before(async () => {
  await connectDB();
});

test.after(async () => {
  await disconnectDB();
});

test("student can register, vendor can create a shop, and student can checkout from cart", async () => {
  const vendorRegister = await request(app).post("/api/auth/register").send({
    name: "Vendor Test",
    email: "vendor-test@example.com",
    password: "password123",
    role: "vendor",
  });

  assert.equal(vendorRegister.statusCode, 201);
  const vendorToken = vendorRegister.body.data.token;

  const studentRegister = await request(app).post("/api/auth/register").send({
    name: "Student Test",
    email: "student-test@example.com",
    password: "password123",
    role: "student",
  });

  assert.equal(studentRegister.statusCode, 201);
  const studentToken = studentRegister.body.data.token;

  const shop = await request(app)
    .post("/api/shops")
    .set("Authorization", `Bearer ${vendorToken}`)
    .send({
      name: "Test Cafe",
      location: "Main Block",
      deliverySupported: true,
      pickupSupported: true,
    });

  assert.equal(shop.statusCode, 201);

  const menuItem = await request(app)
    .post("/api/shops/vendor/me/menu")
    .set("Authorization", `Bearer ${vendorToken}`)
    .send({
      name: "Sandwich",
      price: 50,
    });

  assert.equal(menuItem.statusCode, 201);

  const cart = await request(app)
    .post("/api/cart")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({
      shopId: shop.body.data._id,
      menuItemId: menuItem.body.data._id,
      quantity: 2,
    });

  assert.equal(cart.statusCode, 200);
  assert.equal(cart.body.data.totalPrice, 100);

  const checkout = await request(app)
    .post("/api/cart/checkout")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({
      deliveryMode: "pickup",
    });

  assert.equal(checkout.statusCode, 201);
  assert.equal(checkout.body.data.status, "pending");
  assert.equal(checkout.body.data.totalPrice, 100);
});

test("validation rejects malformed auth request", async () => {
  const response = await request(app).post("/api/auth/register").send({
    name: "",
    email: "bad-email",
    password: "123",
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.ok(Array.isArray(response.body.errors));
});
