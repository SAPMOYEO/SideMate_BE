const User = require("../model/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const authController = {};

authController.authenticate = (req, res, next) => {
  try {
    const tokenString = req.headers.authorization;
    if (!tokenString) throw new Error("토큰이 없습니다.");

    const token = tokenString.replace("Bearer ", "");

    jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
      if (error) throw new Error("유효하지 않은 토큰입니다.");

      req.userId = payload._id;
      next();
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

authController.isAdminCheck = async (req, res, next) => {
  try {
    const { userId } = req;

    // env var 기반 admin 토큰: DB 조회 없이 바로 통과
    if (userId === "admin") {
      req.user = { _id: "admin", role: "admin" };
      return next();
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "admin") throw new Error("관리자 권한이 없습니다.");
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ status: "fail", message: error.message });
  }
};
module.exports = authController;
