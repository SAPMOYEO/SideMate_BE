const express = require("express");
const router = express.Router();

const paymentApi = require("./payment.api");
router.use("/payment", paymentApi);

module.exports = router;
