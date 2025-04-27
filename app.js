const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');

//error helpers
const prismaErrorHandler = require('./src/middlewares/prisma_error.middleware');
const errorHandlers = require('./src/middlewares/error.middleware').all;

const app = express();

//listen to the port of fe
// app.use(cors({
//   origin: 'http://localhost:8081',
//   credentials: true,
// }));

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//routes
app.use('/api', routes);


app.get('/test', (req, res) => {
  res.send('Test route works!');
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

//Error handlers
app.use(prismaErrorHandler);
app.use(errorHandlers);

module.exports = app;


