const User = require("../model/User");
const bcrypt = require("bcryptjs");

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
      techStacks,
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

module.exports = userController;
