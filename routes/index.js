const express = require("express");
const router = express.Router();

const paymentApi = require("./payment.api");
const aiQuotaApi = require("./aiQuota.api");
const aiUsageApi = require("./aiUsage.api");

router.use("/payment", paymentApi);
router.use("/aiquota", aiQuotaApi);
router.use("/aiusage", aiUsageApi);

module.exports = router;
