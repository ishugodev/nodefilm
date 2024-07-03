require("express-async-errors");

const express = require("express");

const routes = require("./routes");
const AppError = require("./utils/AppError");
const migrationsRun = require("./database/sqlite/migrations");

migrationsRun();

const app = express();
app.use(express.json());

app.use(routes);

app.use(( error, request, response, next ) => {
  if(error instanceof AppError) {
    return response.status(error.statusCode).json({
      status: "error",
      message: error.message
    });
  }

  console.log(error);

  return response.status(500).json({
    status: "error",
    message: "Internal server error"
  });
});

const PORT = 1111;
app.listen(PORT, () => console.log(`Server is running on: localhost:${PORT}`));