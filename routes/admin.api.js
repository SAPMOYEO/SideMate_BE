const express = require("express");

const adminController = require("../controller/admin.controller");
const authController = require("../controller/auth.controller");

const router = express.Router();

router.get(
  "/users",
  /*인증관련, 어드민 체크*/ authController.authenticate,
  authController.isAdminCheck,
  adminController.getUsers,
);
router.get(
  "/projects",
  /*인증관련, 어드민 체크*/ authController.authenticate,
  authController.isAdminCheck,
  adminController.getProjects,
);
router.get(
  "/notifications",
  /*인증관련, 어드민 체크*/ authController.authenticate,
  authController.isAdminCheck,
  adminController.getNotifications,
);
router.get(
  "/banners",
  /*인증관련, 어드민 체크*/ authController.authenticate,
  authController.isAdminCheck,
  adminController.getBanners,
);
router.post(
  "/banners",
  /*인증관련, 어드민 체크*/ authController.authenticate,
  authController.isAdminCheck,
  adminController.createBanner,
);
router.patch(
  "/banners/:id",
  /*인증관련, 어드민 체크*/ authController.authenticate,
  authController.isAdminCheck,
  adminController.updateBanner,
);
router.delete(
  "/banners/:id",
  /*인증관련, 어드민 체크*/ authController.authenticate,
  authController.isAdminCheck,
  adminController.deleteBanner,
);
module.exports = router;
