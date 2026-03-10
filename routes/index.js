const express = require("express");
const router = express.Router();

const paymentApi = require("./payment.api");
const aiQuotaApi = require("./aiQuota.api");
const aiUsageApi = require("./aiUsage.api");
const projectApi = require("./project.api");
const adminApi = require("./admin.api");
const userApi = require("./user.api");
const authApi = require("./auth.api");
const applicationApi = require("./application.api");

router.use("/project", projectApi);
router.use("/admin", adminApi);
router.use("/user", userApi);
router.use("/payment", paymentApi);
router.use("/aiquota", aiQuotaApi);
router.use("/aiusage", aiUsageApi);
router.use("/auth", authApi);
router.use("/application", applicationApi);

module.exports = router;
