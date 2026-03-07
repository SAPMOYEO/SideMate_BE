const express = require("express");

const adminController = require("../controller/admin.controller");
const authController = require("../controller/auth.controller");

const router = express.Router();

router.use(authController.authenticate, authController.isAdminCheck);

router.get("/users", adminController.getUsers);
router.patch("/users/:id", adminController.activeUser);

router.get("/projects", adminController.getProjects);
router.get("/notifications", adminController.getNotifications);

router.get("/banners", adminController.getBanners);
router.post("/banners", adminController.createBanner);
router.patch("/banners/:id", adminController.updateBanner);
router.delete("/banners/:id", adminController.deleteBanner);

module.exports = router;
