const User = require("../model/User");
const AiQuota = require("../model/AiQuota");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const cloudinary = require("cloudinary").v2;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const { addOneMonthCalendar } = require("../utils/date.util");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const userController = {};
userController.register = async (req, res) => {
  try {
    const { email, password, name, phone, techStacks, terms } = req.body;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new Error("이미 가입된 이메일입니다.");
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      throw new Error("이미 사용 중인 휴대폰 번호입니다.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      phone,
      profile: {
        techStack: techStacks || [],
      },
      marketingAgree: terms.marketing,
      privacySettings: {
        isImagePublic: false,
        isEmailPublic: false,
        isGithubPublic: false,
        isBioPublic: false,
      },
    });

    await newUser.save();

    // ai 사용 횟수 db 생성
    const now = new Date();

    await AiQuota.create({
      userId: newUser._id,
      freeCycleAnchorAt: now,
      freeResetAt: addOneMonthCalendar(now),
    });

    return res.status(200).json({ status: "success", user: newUser });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

userController.registerSocialUser = async (req, res, next) => {
  try {
    const {
      googleId,
      email,
      name,
      phone,
      techStacks,
      profileImage,
      marketingAgree,
    } = req.body;

    if (!email || !name) {
      throw new Error("필수 정보(이메일, 이름)가 누락되었습니다.");
    }

    console.log("1. FE에서 넘어온 이미지 URL:", profileImage);

    let finalProfileImage = profileImage || "";

    if (
      profileImage &&
      (profileImage.includes("googleusercontent") ||
        profileImage.includes("ggpht"))
    ) {
      try {
        console.log("2. Cloudinary 업로드 시도 중...");
        const uploadResponse = await cloudinary.uploader.upload(profileImage, {
          folder: "sidemate_profiles",
          use_filename: true,
        });
        if (uploadResponse.secure_url) {
          finalProfileImage = uploadResponse.secure_url;
        }
      } catch (uploadError) {
        console.error(
          "Cloudinary 구글 이미지 업로드 실패:",
          uploadError.message,
        );
      }
    } else {
      console.log("2. 구글 이미지가 아니거나 이미 처리된 주소입니다.");
    }

    const user = new User({
      name,
      email,
      googleId,
      phone,
      provider: "google",
      password: "social-login-temp-password-" + Math.random() * 100,
      marketingAgree: marketingAgree || false,
      privacySettings: {
        isImagePublic: true,
        isEmailPublic: false,
        isGithubPublic: true,
        isBioPublic: true,
      },
      profile: {
        profileImage: finalProfileImage,
        techStack: techStacks || [],
      },
    });
    await user.save();
    const now = new Date();

    await AiQuota.create({
      userId: user._id,
      freeCycleAnchorAt: now,
      freeResetAt: addOneMonthCalendar(now),
    });

    console.log("4. DB 저장 완료");

    const token = await user.generateToken();
    res.status(201).json({ status: "success", token, user: user });
  } catch (error) {
    console.error("!!! 전체 가입 로직 에러:", error.message);
    res.status(400).json({ status: "fail", message: error.message });
  }
};

userController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("이메일 또는 비밀번호가 일치하지 않습니다.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("이메일 또는 비밀번호가 일치하지 않습니다.");
    }

    const token = await user.generateToken();

    return res.status(200).json({
      status: "success",
      user,
      token,
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

userController.loginWithGoogle = async (req, res) => {
  try {
    const { token } = req.body;
    const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const { email, name, picture, sub } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        status: "success",
        isNewUser: true,
        user: {
          email,
          name,
          picture,
          googleId: sub,
        },
      });
    }

    const sessionToken = await user.generateToken();
    res.status(200).json({ status: "success", user, token: sessionToken });
  } catch (error) {
    console.error("구글 로그인 에러 발생:", error);
    res.status(400).json({ status: "fail", message: error.message });
  }
};

userController.getUser = async (req, res) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "가입되지 않은 유저입니다. 온보딩이 필요합니다.",
      });
    }

    res.status(200).json({ status: "success", user });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

userController.updateUser = async (req, res) => {
  try {
    const { userId } = req;
    const { name, profile, phone, marketingAgree, privacySettings } = req.body;

    if (phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: userId } });
      if (phoneExists) {
        throw new Error("이미 사용 중인 휴대폰 번호입니다.");
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          phone,
          marketingAgree,
          privacySettings,
          "profile.techStack": profile?.techStack,
          "profile.gitUrl": profile?.gitUrl,
          "profile.bio": profile?.bio,
          ...(profile?.profileImage && {
            "profile.profileImage": profile.profileImage,
          }),
        },
      },
      { new: true, runValidators: true },
    );

    if (!user) throw new Error("유저를 찾을 수 없습니다.");
    res.status(200).json({ status: "success", user });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

userController.checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      throw new Error("이메일을 입력해주세요.");
    }

    const user = await User.findOne({ email });

    return res.status(200).json({
      status: "success",
      isDuplicate: !!user,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

userController.checkPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      throw new Error("휴대폰 번호를 입력해주세요.");
    }

    const user = await User.findOne({ phone });

    return res.status(200).json({
      status: "success",
      isDuplicate: !!user,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

module.exports = userController;
