const Banner = require("../model/Banner");
const bannerController = {};

const BANNER_LIMIT = 3; // 최대 3개의 배너만 반환

bannerController.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({
        createdAt: -1,
      })
      .limit(BANNER_LIMIT);
    res.status(200).json({ message: "배너 조회 성공", banners });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = bannerController;
