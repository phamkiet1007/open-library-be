const express = require("express");
const cors = require("cors");
// const routes = require("./src/routes");
const path = require("path");
const routes = require(path.join(__dirname, "src", "routes"));
require("dotenv").config();

//error helpers
const prismaErrorHandler = require("./src/middlewares/prisma_error.middleware");
const errorHandlers = require("./src/middlewares/error.middleware").all;

const app = express();

// CORS configuration
const allowedOrigins = [
  "https://openlib88.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8081",
];

// Use the cors middleware properly
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Additional CORS handling for complex requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).send();
  }
  next();
});

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.use("/api", routes);

// In app.js

app.get("/test", (req, res) => {
  res.send("Test route works!");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//Error handlers
app.use(prismaErrorHandler);
app.use(errorHandlers);

module.exports = app;
