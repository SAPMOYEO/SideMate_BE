const express = require("express");

const adminController = require("../controller/admin.controller");

const router = express.Router();

router.get("/users", adminController.getUsers);
router.get("/projects", adminController.getProjects);
router.get("/notifications", adminController.getNotifications);
router.get("/banners", adminController.getBanners);
