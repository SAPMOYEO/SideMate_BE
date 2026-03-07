const Banner = require("../model/Banner");
const adminController = {};

adminController.getUsers = (req, res) => {};
adminController.getProjects = (req, res) => {};
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
