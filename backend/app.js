const express = require("express");
const ROUTES = require("./constants/routes");
const STATUS_CODE = require("./constants/status-code");
const globalErrorHandler = require("./Controllers/error/error-controller");
const AppError = require("./helpers/app-error");
const limiter = require("express-rate-limit");
const helmet = require("helmet");
const expressSanitization = require("express-mongo-sanitize");
const hpp = require("hpp");
const session = require("express-session");
const cors = require("cors");
// Routes
const authRouter = require("./routes/authentication/authentication-router");
const userRouter = require("./routes/user/user-router");

// App initilaization
const app = express();

// *Global Middlewares

// HTTP security headers
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(helmet());
app.use(
  session({
    secret: process.env.GITHUB_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
// Request Rate Limit
const rateLimiter = limiter.rateLimit({
  windowMs: 1000 * 60 * 60,
  limit: 500,
  message: "Too many request please come back in an hour",
});
app.use("/api", rateLimiter);

// Middleware for body parser
app.use(express.json({ limit: "10kb" }));

// Data Sanitization against NOSQL injection
app.use(expressSanitization());

// HTTP parameter polutions
app.use(hpp({ whitelist: ["duration", "price"] }));

// Mounting Routers
app.use(ROUTES.AUTH, authRouter);
app.use(ROUTES.USER, userRouter);

app.all("*", (req, res, next) => {
  let error = new AppError("Route not Found", STATUS_CODE.NOT_FOUND);
  next(error);
});

// Global error handler middleware
app.use(globalErrorHandler);

module.exports = app;
