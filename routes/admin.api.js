const express = require("express");

const adminController = require("../controller/admin.controller");
const authController = require("../controller/auth.controller");

const router = express.Router();

// 로그인은 인증 미들웨어 적용 전에 등록
router.post("/login", adminController.adminLogin);

// 이후 모든 라우트에 인증 미들웨어 적용
router.use(authController.authenticate, authController.isAdminCheck);

router.get("/users", adminController.getUsers);
router.patch("/users/:id", adminController.activeUser);

router.get("/projects", adminController.getProjects);
router.patch("/projects/:id/hidden", adminController.updateProjectHiddenYn);
router.get("/notifications", adminController.getNotifications);

router.get("/banners", adminController.getBanners);
router.post("/banners", adminController.createBanner);
router.patch("/banners/:id", adminController.updateBanner);
router.delete("/banners/:id", adminController.deleteBanner);

module.exports = router;
