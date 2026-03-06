const express = require("express");
const router = express.Router();

const paymentApi = require("./payment.api");
const aiQuotaApi = require("./aiQuota.api");
const aiUsageApi = require("./aiUsage.api");
const projectApi = require("./project.api");
const userApi = require("./user.api");

router.use("/project", projectApi);
router.use("/user", userApi);
router.use("/payment", paymentApi);
router.use("/aiquota", aiQuotaApi);
router.use("/aiusage", aiUsageApi);

module.exports = router;
