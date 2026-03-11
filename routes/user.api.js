const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const authController = require("../controller/auth.controller");

router.get("/check-email", userController.checkEmail);
router.post("/register", userController.register);
router.post("/register-social", userController.registerSocialUser);
router.post("/login", userController.login);
router.post("/google", userController.loginWithGoogle);
router.get("/me", authController.authenticate, userController.getUser);
router.put("/me", authController.authenticate, userController.updateUser);
router.post("/find-email", authController.findEmail);
router.post("/forgot-password", authController.forgotPassword);
router.put("/reset-password", authController.resetPassword);
router.get("/verify-reset-token/:token", authController.verifyResetToken);
router.get("/check-phone", userController.checkPhone);

module.exports = router;
