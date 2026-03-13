const Feedback = require("../model/Feedback");
const { requestProjectFeedbackAndSave } = require("../services/feedback.service");
const feedbackController = {};

// 프로젝트 모집글 AI 피드백 생성
// 생성전 : projectId는 없음, type : project-create-draft
// 생성후 : projectId 있음,  type : project-detail
feedbackController.createProjectFeedback = async (req, res) => {
  try {
    const { userId } = req;

    const {
      projectId, // 생성 전이면 없을 수 있음
      requestId,
      tempProjectId,
      type,
      inputSnapshot,
    } = req.body;

    const result = await requestProjectFeedbackAndSave({
      userId,
      projectId: projectId || null,
      requestId,
      tempProjectId,
      type,
      inputSnapshot,
    });

    return res.status(200).json({
      status: "success",
      feedbackId: result.feedbackId,
      feedback: result.feedback,
      quota: result.quota,
      summary: result.summary,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

// 생성 전 draft 피드백 최신 1개 조회
feedbackController.getLatestDraftProjectFeedback = async (req, res) => {
  try {
    const { userId } = req;
    const { tempProjectId } = req.params;

    const feedback = await Feedback.findOne({
      user: userId,
      tempProjectId,
      type: "project-create-draft",
    })
      .sort({ createdAt: -1 })
      .select(
        "_id type overallComment strengths weaknesses suggestions fullResponse inputSnapshot createdAt updatedAt",
      )
      .lean();

    return res.status(200).json({
      status: "success",
      data: feedback,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

// 특정 프로젝트의 AI 피드백 목록 조회
feedbackController.getProjectFeedbacks = async (req, res) => {
  try {
    const { userId } = req;
    const { projectId } = req.params;

    const feedbackList = await Feedback.find({
      user: userId,
      project: projectId,
    })
      .sort({ createdAt: -1 })
      .select(
        "_id type strengths overallComment  weaknesses suggestions fullResponse inputSnapshot createdAt updatedAt",
      )
      .lean();

    return res.status(200).json({
      status: "success",
      data: feedbackList,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

module.exports = feedbackController;
