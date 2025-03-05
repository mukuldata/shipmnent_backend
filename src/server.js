require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const redisClient = require("./config/redisClient");
const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const { pollQueue } = require("./workers/orderProcessor");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ALLOW_ORIGIN || "http://localhost:3000", credentials: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
connectDB();
redisClient.connect();
pollQueue();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
