const notiController = {};
const Notification = require("../model/Notification");
// 알람 생성 헬퍼
notiController.createNotification = async ({
  receiver,
  actor,
  relatedProject,
  relatedApplication,
  messageType,
}) => {
  await Notification.create({
    receiver,
    actor,
    relatedProject,
    relatedApplication,
    messageType,
  });
};

notiController.getNotifications = async (req, res) => {
  try {
    const { userId } = req;
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const notification = await Notification.find({
      receiver: userId,
      createdAt: { $gte: threeDaysAgo },
    })
      .sort({ createdAt: -1 })
      .populate("actor", "name image")
      .populate("relatedProject", "title")
      .lean();

    res.status(200).json({ status: "조회 성공", data: notification });
  } catch (error) {
    res.status(400).json({ status: "조회 실패", message: error.message });
  }
};

notiController.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req;
    const count = await Notification.countDocuments({
      receiver: userId,
      isRead: false,
    });
    res.status(200).json({ status: "success", count });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

notiController.markAsRead = async (req, res) => {
  try {
    const { userId } = req;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, receiver: userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ status: "fail", message: "알림 없음" });
    }
    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

module.exports = notiController;
