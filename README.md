# Campus Food Delivery Application

Campus food and shop ordering platform built with:

- server/: Express + PostgreSQL backend
- client/: React + Vite frontend

## Current status

Implemented:

- Authentication with JWT for student, endor, dmin, and delivery personnel
- Student flows for browsing shops, adding to cart, checkout, order tracking, and feedback
- Vendor flows for shop creation, menu management, order status updates, and sales summary
- Delivery flows with real-time assignment pool, availability toggling, route management, and status updates
- Admin flows for dashboard metrics, user management, shop overview, and order overview
- Live, real-time updates for orders via WebSockets (socket.io)
- Backend validation and basic security middleware
- API integration tests
- Frontend dashboards for student, vendor, delivery, and admin

## Run the project

### Database setup

You must have a PostgreSQL instance running. Configure connection parameters inside server/.env (e.g., PG_USER, PG_HOST, PG_DATABASE, PG_PASSWORD, PG_PORT).

### Backend

`ash
cd server
npm install
npm run dev
`

### Frontend

`ash
cd client
npm install
npm run dev
`

Set VITE_API_BASE_URL in client/.env if your backend is not running on http://127.0.0.1:5000.

## Test and verify

### Backend tests

`ash
cd server
npm test
`

### Frontend production build

`ash
cd client
npm run build
`

## Full user flow

### 1. Admin setup

1. Start the backend.
2. Setup the PostgreSQL database and run the 
pm run seed script in server/ to generate demo data.
3. Log in as admin from the frontend.
4. Review platform summary, users, shops, and orders.
5. Activate or deactivate accounts if needed.

### 2. Vendor onboarding

1. Register as a endor.
2. Log in from the frontend.
3. Open the vendor dashboard.
4. Create a shop with name, location, description, and contact details.
5. Add menu items with price, category, and availability.
6. Watch incoming orders in the vendor order queue real-time.
7. Update order status from pending to preparing, and eady (which notifies the delivery personnel if it is a campus delivery, or the student if picking up).

### 3. Student ordering flow

1. Register as a student.
2. Log in from the frontend.
3. Browse all available campus shops.
4. Open a specific shop to see menu items and existing feedback.
5. Add items to the cart.
6. Choose pickup or campus_delivery. Add a delivery address if applicable.
7. Checkout the cart to create an order.
8. Track the order status real-time on the student dashboard.
9. After delivery/pickup, submit feedback for the order.

### 4. Delivery workflow

1. Register as a delivery person.
2. Log in from the frontend to access the Delivery Dashboard.
3. Toggle status to "Available" to start receiving real-time campus delivery orders.
4. Watch for orders that are "Ready for Delivery" to populate in the "Available Orders Pool".
5. Claim an order for pickup and navigate to the vendor's shop.
6. Mark the order as picked_up and proceed to drop off at the student's campus address.
7. Mark the order successfully as delivered.

### 5. Admin monitoring flow

1. Log in as an admin.
2. Review total users, shops, orders, active orders, and revenue.
3. Inspect shops and orders for operational visibility.
4. Deactivate abusive or inactive accounts if needed.

## Suggested next improvements

- Add charts and richer reporting for vendors and admins
- Add image upload for shops and menu items
- Add deployment setup for Render, Railway, or a VPS
