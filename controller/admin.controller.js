const User = require("../model/User");
const Banner = require("../model/Banner");
const Project = require("../model/Project");
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
    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });

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
      { new: true },
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project updated successfully", data: project });
  } catch (err) {
    res.status(500).json({ message: "Error updating project hidden status", error: err });
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
    const { imageUrl, isActive } = req.body;

    const newBanner = new Banner({ imageUrl, isActive });

    await newBanner.save();
    res.status(201).json({
      status: "success",
      message: "Banner created successfully",
      data: newBanner,
    });
  } catch (err) {
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
      { new: true },
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

module.exports = adminController;
