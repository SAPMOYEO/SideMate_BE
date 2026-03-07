// AI 사용 요청 관련 컨트롤러
// HOLD / COMMIT / CANCEL 요청을 처리

const aiUsageService = require("../services/aiUsage.service");

const aiUsageController = {};

// AI 사용 요청 시작 (HOLD 생성)
aiUsageController.createHold = async (req, res) => {
  try {
    const { userId } = req;
    const { requestId, postId } = req.body;

    const result = await aiUsageService.createHold({
      userId,
      requestId,
      postId,
    });

    return res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

// AI 요청 성공 처리 - (실제 차감)
aiUsageController.commit = async (req, res) => {
  try {
    const { userId } = req;
    const { requestId } = req.params;

    const result = await aiUsageService.commitHold({
      userId,
      requestId,
    });

    return res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

// AI 요청 실패 - 취소 처리
aiUsageController.cancel = async (req, res) => {
  try {
    const { userId } = req;
    const { requestId } = req.params;
    const { reason, errorMessage } = req.body;

    const result = await aiUsageService.cancelHold({
      userId,
      requestId,
      reason,
      errorMessage,
    });

    return res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error: error.message,
    });
  }
};

module.exports = aiUsageController;
