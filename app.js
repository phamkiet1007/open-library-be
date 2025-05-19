const express = require("express");
const cors = require("cors");
const routes = require("./src/routes");
require("dotenv").config();


//error helpers
const prismaErrorHandler = require("./src/middlewares/prisma_error.middleware");
const errorHandlers = require("./src/middlewares/error.middleware").all;

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

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
