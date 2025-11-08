import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./utils/db.js";

import projectRouter from "./routes/projectRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import authRouter from "./routes/authRoutes.js";
import studentRouter from "./routes/studentRoutes.js";
import facultyRouter from "./routes/facultyRoutes.js";
import correlationId from './middlewares/correlationId.js';
import requestLogger from './middlewares/requestLogger.js';
import logger from './utils/logger.js';

import otpRouter from "./routes/otpRoutes.js";
import helmet from "helmet";

dotenv.config();
connectDB();

// import "./utils/deadlineRemainder.js";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://cpms-latest.vercel.app",
  "https://cpms-latest-projectpurposes-projects.vercel.app",
  "https://cpms-latest-git-main-projectpurposes-projects.vercel.app",
];

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);

const normalizePanelIds = (panelIds) => {
  if (!panelIds) {
    return [];
  }
  const list = Array.isArray(panelIds) ? panelIds : [panelIds];
  return Array.from(
    new Set(
      list
        .map((id) => {
          if (id === null || id === undefined) {
            return null;
          }
          if (typeof id === "object" && typeof id.toString === "function") {
            return id.toString();
          }
          return String(id);
        })
        .filter(Boolean)
    )
  );
};

io.on("connection", (socket) => {
  logger.info('socket_connected', { socketId: socket.id });

  socket.on("panel:join", (panelIds) => {
    const rooms = normalizePanelIds(panelIds);
    rooms.forEach((panelId) => {
      const room = `panel:${panelId}`;
      socket.join(room);
      logger.debug('socket_join_panel', { socketId: socket.id, room });
    });
  });

  socket.on("panel:leave", (panelIds) => {
    const rooms = normalizePanelIds(panelIds);
    rooms.forEach((panelId) => {
      const room = `panel:${panelId}`;
      socket.leave(room);
      logger.debug('socket_leave_panel', { socketId: socket.id, room });
    });
  });

  socket.on("disconnect", (reason) => {
    logger.info('socket_disconnected', { socketId: socket.id, reason });
  });
});

// Use Helmet
app.use(helmet());

// Set HSTS for 1 year (in seconds)
// Check if you're in development environment
if (process.env.NODE_ENV !== "production") {
  // Disable HSTS completely in development
  app.use(
    helmet({
      hsts: false,
    })
  );
} else {
  // Keep HSTS enabled in production
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    })
  );
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser()); // good to have for future

// correlation id (requestId) must be set before request logging
app.use(correlationId);
// request logger - logs incoming requests and timings
app.use(requestLogger);

const PORT = process.env.PORT || 5000;

// Mount API routes
app.use("/api/auth", authRouter); // POST /api/auth/login
app.use("/api/project", projectRouter); // project routes
app.use("/api/admin", adminRouter); // GET /api/admin/allFaculty etc.
app.use("/api/student", studentRouter);
app.use("/api/faculty", facultyRouter); // GET /api/faculty/getFacultyDetails/:id
app.use("/api/otp", otpRouter);

server.listen(PORT, () => {
  logger.info('server_start', { message: `Server running at http://localhost:${PORT}` });
});
