import jwt from "jsonwebtoken";
import { Message, Notification } from "../models/index.js";
import { JWT_SECRET } from "../middleware/auth.js";

// Real-time delivery of direct/group messages + live notifications.
// Auth: client connects with { auth: { token } }; we verify the JWT once
// at connection time rather than trusting a plain user_id from the client.
export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, JWT_SECRET);
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error("Unauthorized socket connection"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`); // personal room for notifications/DMs

    socket.on("join_group", (groupId) => {
      socket.join(`group:${groupId}`);
    });

    // Direct message
    socket.on("send_direct", async ({ receiver_id, body }) => {
      const msg = await Message.create({
        sender_id: userId,
        receiver_id,
        is_group: false,
        body,
      });
      io.to(`user:${receiver_id}`).to(`user:${userId}`).emit("new_direct_message", msg);

      await Notification.create({
        user_id: receiver_id,
        type: "message",
        message: `New message from ${socket.user.full_name}`,
      });
      io.to(`user:${receiver_id}`).emit("notification", {
        type: "message",
        message: `New message from ${socket.user.full_name}`,
      });
    });

    // Group message
    socket.on("send_group", async ({ group_id, body }) => {
      const msg = await Message.create({
        sender_id: userId,
        group_id,
        is_group: true,
        body,
      });
      io.to(`group:${group_id}`).emit("new_group_message", msg);
    });

    socket.on("disconnect", () => {
      // no-op for now; room membership is cleaned up automatically
    });
  });
}
