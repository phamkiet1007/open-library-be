require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});

server.setTimeout(10 * 60 * 1000);
