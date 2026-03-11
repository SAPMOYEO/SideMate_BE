const User = require("../model/User");
const Banner = require("../model/Banner");
const Project = require("../model/Project");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const adminController = {};

adminController.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, query = "", sort = "-createdAt" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const cond = {};
    if (query) {
      cond.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }
    const totalCount = await User.countDocuments(cond);
    const totalPages = Math.ceil(totalCount / Number(limit));
    const todayCount = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    });
    const users = await User.find(cond)
      .skip(skip)
      .limit(Number(limit))
      .sort(sort);

    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      totalCount,
      totalPages,
      todayCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
};
adminController.activeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: "after" },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User activated successfully", data: user });
  } catch (err) {
    res.status(500).json({ message: "Error activating user", error: err });
  }
};

adminController.getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 5, query = "", sort = "createdAt" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const cond = query ? { title: { $regex: query, $options: "i" } } : {};
    const todayCount = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    });
    const totalCount = await Project.countDocuments(cond);
    const totalPages = Math.ceil(totalCount / Number(limit));
    const projects = await Project.find(cond)
      .skip(skip)
      .limit(Number(limit))
      .sort(sort);

    res.status(200).json({
      message: "Projects fetched successfully",
      data: projects,
      totalCount,
      totalPages,
      todayCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching projects", error: err });
  }
};
adminController.updateProjectHiddenYn = async (req, res) => {
  try {
    const { id } = req.params;
    const { hiddenYn } = req.body;
    const project = await Project.findByIdAndUpdate(
      id,
      { hiddenYn },
      { returnDocument: "after" },
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res
      .status(200)
      .json({ message: "Project updated successfully", data: project });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating project hidden status", error: err });
  }
};
adminController.getNotifications = (req, res) => {};

adminController.getBanners = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const skip = page ? (page - 1) * limit : 0;

    const totalCount = await Banner.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);
    const banners = await Banner.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    res.status(200).json({
      data: banners,
      totalCount,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching banners", error: err });
  }
};
adminController.createBanner = async (req, res) => {
  try {
    console.log(req.body);
    const { imageUrl, isActive } = req.body;

    console.log(imageUrl, isActive);
    const newBanner = new Banner({ imageUrl, isActive });

    await newBanner.save();
    res.status(201).json({
      status: "success",
      message: "Banner created successfully",
      data: newBanner,
    });
  } catch (err) {
    console.error("createBanner error:", err.message, err.name);
    res.status(500).json({ message: "Error creating banner", error: err });
  }
};

adminController.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl, isActive } = req.body;

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { imageUrl, isActive },
      { returnDocument: "after" },
    );

    if (!updatedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Banner updated successfully",
      data: updatedBanner,
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating banner", error: err });
  }
};
adminController.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Banner.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Banner deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Error deleting banner", error: err });
  }
};

adminController.adminLogin = async (req, res) => {
  try {
    const { name, password } = req.body;

    const adminId = process.env.ADMIN_ID;
    const adminPassword = process.env.ADMIN_PW;

    if (name === adminId && password === adminPassword) {
      // env var 기반 admin → DB 조회 없이 특수 payload로 JWT 생성
      const token = jwt.sign({ _id: "admin", role: "admin" }, JWT_SECRET_KEY, {
        expiresIn: "1d",
      });
      return res.status(200).json({
        status: "success",
        message: "Admin login successful",
        token,
      });
    } else {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid email or password" });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
module.exports = adminController;
