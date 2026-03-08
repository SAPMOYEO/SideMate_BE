const User = require("../model/User");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const cloudinary = require("cloudinary").v2;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const userController = {};

userController.register = async (req, res) => {
  try {
    const { email, password, name, phone, techStacks, terms } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error("이미 가입된 이메일입니다.");
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
    });

    await newUser.save();

    return res.status(200).json({ status: "success", user: newUser });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
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
    const { email, name, picture } = ticket.getPayload();
    let user = await User.findOne({ email });
    if (!user) {
      const uploadResponse = await cloudinary.uploader.upload(picture, {
        folder: "sidemate_profiles",
      });
      const randomPassword = "" + Math.floor(Math.random() * 100000000);
      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(randomPassword, salt);
      user = new User({
        name,
        email,
        password: newPassword,
        profile: {
          profileImage: uploadResponse.secure_url,
          techStack: [],
        },
      });
      await user.save();
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
    if (!user) throw new Error("유저를 찾을 수 없습니다.");

    res.status(200).json({ status: "success", user });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

userController.updateUser = async (req, res) => {
  try {
    const { userId } = req;
    const { name, profile } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
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

module.exports = userController;
