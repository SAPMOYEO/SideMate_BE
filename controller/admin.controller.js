const Banner = require("../model/Banner");
const adminController = {};

adminController.getUsers = (req, res) => {};
adminController.getProjects = (req, res) => {};
adminController.getNotifications = (req, res) => {};
adminController.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json(banners);
  } catch (err) {
    res.status(500).json({ message: "Error fetching banners", error: err });
  }
};
adminController.createBanner = async (req, res) => {
  try {
    const { title, imageUrl, link } = req.body;
    const newBanner = new Banner({ title, imageUrl, link });
    await newBanner.save();
    res.status(201).json(newBanner);
  } catch (err) {
    res.status(500).json({ message: "Error creating banner", error: err });
  }
};
module.exports = adminController;
