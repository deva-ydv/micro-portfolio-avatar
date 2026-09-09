const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const linkRoutes = require("./routes/link.routes");
const publicRoutes = require("./routes/public.routes");
const redirectRoutes = require("./routes/redirect.routes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

// Core middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
  })
);
app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is healthy" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/public", publicRoutes); // GET /api/public/:slug
app.use("/api/r", redirectRoutes); // GET /api/r/:linkId  (click-through + redirect)

// 404 + error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
