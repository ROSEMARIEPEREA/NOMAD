import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";

import { sequelize } from "./models/index.js";
import { registerSocketHandlers } from "./sockets/index.js";
import { startDeadlineChecker } from "./utils/deadlineChecker.js";

import authRoutes from "./routes/authRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

if (!fs.existsSync("./data")) fs.mkdirSync("./data");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Make io available to REST controllers that also need to emit
// (e.g. board card assignment notifications)
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/board", boardRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

registerSocketHandlers(io);

const PORT = process.env.PORT || 4000;

sequelize
  .sync() // use { alter: true } while iterating on schema, remove for production
  .then(() => {
    server.listen(PORT, () => {
      console.log(`NOMAD backend running on http://localhost:${PORT}`);
      console.log(`DB dialect: ${process.env.DB_DIALECT || "sqlite"}`);
      startDeadlineChecker(io);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
  });
