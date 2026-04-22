const { Server } = require("socket.io");
const { pool } = require("./config/db");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173", process.env.CLIENT_URL || "http://localhost:3000"],
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true
    },
  });

  io.on("connection", (socket) => {
    socket.on("subscribe", (payload = {}) => {
      if (payload.userId) {
        socket.join(`user:${payload.userId}`);
      }

      if (payload.role) {
        socket.join(`role:${payload.role}`);
      }
    });
  });

  return io;
};

const emitOrderUpdate = async (orderId) => {
  if (!io) {
    return;
  }

  const orderQuery = await pool.query(
    `SELECT o.*, 
            s.name as shop_name, s.location as shop_location, s.owner_id as shop_owner_id,
            st.name as student_name, st.email as student_email, st.phone as student_phone, st.role as student_role,
            dp.name as delivery_name, dp.email as delivery_email, dp.phone as delivery_phone, dp.role as delivery_role, dp.current_zone as delivery_zone, dp.is_available as delivery_is_available,
            so.name as shop_owner_name, so.email as shop_owner_email, so.phone as shop_owner_phone, so.role as shop_owner_role
     FROM orders o
     JOIN shops s ON o.shop_id = s.id
     JOIN users st ON o.student_id = st.id
     JOIN users so ON s.owner_id = so.id
     LEFT JOIN users dp ON o.delivery_person_id = dp.id
     WHERE o.id = $1`,
    [orderId]
  );

  if (orderQuery.rows.length === 0) {
    return;
  }

  const order = orderQuery.rows[0];

  const itemsQuery = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
  order.items = itemsQuery.rows;

  io.to(`user:${order.student_id}`).emit("order:update", order);

  if (order.shop_owner_id) {
    io.to(`user:${order.shop_owner_id}`).emit("order:update", order);
  }

  if (order.delivery_person_id) {
    io.to(`user:${order.delivery_person_id}`).emit("order:update", order);
  } else if (order.status === 'ready' && order.delivery_mode === 'campus_delivery') {
    io.to("role:delivery").emit("order:update", order);
  }

  io.to("role:admin").emit("order:update", order);
};

module.exports = {
  initSocket,
  emitOrderUpdate,
};
