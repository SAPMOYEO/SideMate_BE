const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const port = process.env.PORT;
const indexRouter = require("./routes/index");

// Middleware
app.set("query parser", "extended");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/api", indexRouter);

const dbUri = process.env.DB_ADDRESS;
mongoose
  .connect(dbUri)
  .then(() => console.log("mongoose connected"))
  .catch((err) => console.log("DB connection failed", err));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
