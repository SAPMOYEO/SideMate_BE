const express = require("express");

const adminController = require("../controller/admin.controller");

const router = express.Router();

router.get("/users", /*인증관련, 어드민 체크*/ adminController.getUsers);
router.get("/projects", /*인증관련, 어드민 체크*/ adminController.getProjects);
router.get(
  "/notifications",
  /*인증관련, 어드민 체크*/ adminController.getNotifications,
);
router.get("/banners", /*인증관련, 어드민 체크*/ adminController.getBanners);
router.post("/banners", /*인증관련, 어드민 체크*/ adminController.createBanner);
router.patch(
  "/banners/:id",
  /*인증관련, 어드민 체크*/ adminController.updateBanner,
);
router.delete(
  "/banners/:id",
  /*인증관련, 어드민 체크*/ adminController.deleteBanner,
);
module.exports = router;
