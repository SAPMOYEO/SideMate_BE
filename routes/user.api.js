const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const authController = require("../controller/auth.controller");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", authController.authenticate, userController.getUser);
router.put("/me", authController.authenticate, userController.updateUser);

module.exports = router;
