const express = require("express");
const router = express.Router();
const bannerController = require("../controller/banner.controller");
// 배너 조회 API
router.get("/", bannerController.getBanners);

module.exports = router;
