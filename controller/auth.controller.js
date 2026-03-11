const User = require("../model/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const bcrypt = require("bcryptjs");
const {
  getResetPasswordTemplate,
  getGoogleGuideTemplate,
} = require("../utils/emailTemplates");

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
    const user = await User.findById(userId);
    console.log("isAdminCheck - user:", user.role);
    if (user.role !== "admin") throw new Error("관리자 권한이 없습니다.");
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ status: "fail", message: error.message });
  }
};

authController.findEmail = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findOne({ name, phone });

    if (!user) {
      return res
        .status(404)
        .json({ message: "일치하는 사용자 정보가 없습니다." });
    }

    const email = user.email;
    const [id, domain] = email.split("@");

    let maskedId = "";
    if (id.length <= 3) {
      maskedId = id.substring(0, 1) + "*".repeat(id.length - 1);
    } else if (id.length <= 6) {
      maskedId = id.substring(0, 2) + "*".repeat(id.length - 2);
    } else {
      maskedId = id.substring(0, 3) + "*".repeat(id.length - 3);
    }

    const maskedEmail = `${maskedId}@${domain}`;

    res.status(200).json({
      email: maskedEmail,
      provider: user.provider,
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

authController.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    const successResponse = {
      message: "입력하신 정보가 일치하면 재설정 메일이 발송됩니다.",
    };

    if (!user) {
      return res.status(200).json(successResponse);
    }

    if (user.provider === "google") {
      const googleHtmlContent = getGoogleGuideTemplate();

      await sendEmail({
        email: user.email,
        subject: "[SideMate] 요청하신 계정 확인 안내 메일입니다.",
        html: googleHtmlContent,
      });

      return res.status(200).json(successResponse);
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 600000; // 10분
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const resetHtmlContent = getResetPasswordTemplate(resetUrl);

    await sendEmail({
      email: user.email,
      subject: "[SideMate] 요청하신 계정 확인 안내 메일입니다.",
      html: resetHtmlContent,
    });

    res.status(200).json(successResponse);
  } catch (error) {
    console.error("비밀번호 찾기 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

authController.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "유효하지 않거나 만료된 토큰입니다.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      status: "success",
      message: "비밀번호가 성공적으로 변경되었습니다.",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

authController.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "유효하지 않거나 만료된 토큰입니다.",
      });
    }

    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = authController;
