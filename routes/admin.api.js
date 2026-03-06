const express = require("express");

const adminController = require("../controller/admin.controller");

const router = express.Router();

router.get("/users", adminController.getUsers);
router.get("/projects", adminController.getProjects);
router.get("/notifications", adminController.getNotifications);
router.get("/banners", adminController.getBanners);
router.post("/banners", adminController.createBanner);
router.patch("/banners/:id", adminController.updateBanner);
router.delete("/banners/:id", adminController.deleteBanner);
module.exports = router;
