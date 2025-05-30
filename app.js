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

const allowedOrigins = [
  "https://flexiblelib.netlify.app",
  "http://localhost:5173",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

//listen to the port of fe
// app.use(cors({
//   origin: 'http://localhost:8081',
//   credentials: true,
// }));

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
