const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const port = 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});