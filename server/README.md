# Campus Food Delivery Backend

Backend API for a campus shop and food delivery system built with Node.js, Express, and MongoDB.

## Features

- JWT authentication with role-based access control
- Student APIs for shop browsing, ordering, tracking, and feedback
- Vendor APIs for shop management, menu updates, orders, and sales summary
- Admin APIs for summary metrics, users, shops, and order visibility
- In-memory MongoDB fallback for local development when `MONGODB_URI` is not set

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example` if you want a persistent MongoDB database.

3. Start the server:

```bash
npm run dev
```

If `MONGODB_URI` is missing, the app will start with an in-memory MongoDB instance for development.

## Seed demo data

Run:

```bash
npm run seed
```

This creates demo `admin`, `vendor`, and `student` users plus a sample shop with menu items.
Set `MONGODB_URI` first, because persistent seeding should target a real MongoDB database rather than the temporary in-memory fallback.

## Main routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/shops`
- `POST /api/shops`
- `POST /api/orders`
- `GET /api/orders/my-orders`
- `GET /api/orders/vendor`
- `GET /api/admin/summary`
- `POST /api/feedback`

## Postman

Import these files into Postman:

- [Campus-Food-Delivery.postman_collection.json](/d:/RandomStuffs/sweproject/server/postman/Campus-Food-Delivery.postman_collection.json)
- [Campus-Food-Delivery-Local.postman_environment.json](/d:/RandomStuffs/sweproject/server/postman/Campus-Food-Delivery-Local.postman_environment.json)

Suggested testing order:

1. Start the server with `npm run dev`
2. Import the collection and local environment
3. Run `Register Vendor`
4. Run `Register Student`
5. Run `Create Shop`
6. Run `Add Menu Item`
7. Run `Place Order`
8. Run `Vendor Set Preparing`, `Vendor Set Ready`, and `Vendor Set Delivered`
9. Run `Submit Feedback`

The collection saves tokens and important ids like `shopId`, `menuItemId`, and `orderId` into the Postman environment automatically after successful requests.

## Cart flow

Students can now build an order through the cart first and then checkout.

Main cart routes:

- `GET /api/cart`
- `POST /api/cart`
- `PATCH /api/cart/items/:menuItemId`
- `DELETE /api/cart/items/:menuItemId`
- `DELETE /api/cart`
- `POST /api/cart/checkout`

Suggested cart testing order in Postman:

1. Run `Register Student`
2. Run `Create Shop`
3. Run `Add Menu Item`
4. Run `Add To Cart`
5. Run `Get My Cart`
6. Run `Checkout Cart`
