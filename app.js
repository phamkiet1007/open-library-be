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
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://flexiblelib.netlify.app",
        "http://localhost:5173",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.options("*", cors());

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
app.get("/api/test", (req, res) => {
  res.json({ message: "Connection successful!" });
});
