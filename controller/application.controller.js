const mongoose = require("mongoose");
const Application = require("../model/Application");
const Project = require("../model/Project");
const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 10;
const createNotifcation = require("./notification.controller");
const notiController = require("./notification.controller");
const applicationController = {};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

applicationController.createApplication = async (req, res) => {
  try {
    const { project, role, motivation } = req.body;
    const { userId } = req;

    if (!project || !role || !motivation) {
      return res.status(400).json({
        status: "fail",
        message: "project, role, motivation은 필수입니다.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(project)) {
      return res.status(400).json({
        status: "fail",
        message: "유효하지 않은 프로젝트 아이디입니다.",
      });
    }

    const targetProject = await Project.findById(project)
      .select("author")
      .lean();

    if (!targetProject) {
      return res.status(404).json({
        status: "fail",
        message: "프로젝트를 찾을 수 없습니다.",
      });
    }

    if (String(targetProject.author) === String(userId)) {
      return res.status(400).json({
        status: "fail",
        message: "본인이 등록한 프로젝트에는 지원할 수 없습니다.",
      });
    }

    const duplicated = await Application.findOne({
      project,
      applicant: userId,
    }).lean();

    if (duplicated) {
      return res.status(409).json({
        status: "fail",
        message: "이미 지원한 프로젝트입니다.",
      });
    }

    const application = new Application({
      project,
      applicant: userId,
      role,
      motivation,
    });

    await application.save();

    try {
      await notiController.createNotification({
        receiver: targetProject.author,
        actor: userId,
        relatedProject: project,
        relatedApplication: application._id,
        messageType: "NEW_APPLICANT",
      });
    } catch (error) {
      console.log(error);
    }
    return res.status(200).json({ status: "success", application });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

// GET /application/:id  (:id = projectId)
applicationController.getApplication = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        status: "fail",
        message: "유효하지 않은 프로젝트 아이디입니다.",
      });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, PAGE_SIZE);
    const sort =
      req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const condition = { project: projectId };

    const totalCount = await Application.countDocuments(condition);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const applications = await Application.find(condition)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(
        "applicant",
        "name profile.techStack profile.profileImage profile.bio profile.gitUrl privacySettings",
      )
      .exec();

    return res.status(200).json({
      status: "success",
      data: applications,
      totalCount,
      totalPages,
    });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

applicationController.updateApplication = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { userId } = req;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        status: "fail",
        message: "유효하지 않은 지원 아이디입니다.",
      });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        status: "fail",
        message: "지원 정보를 찾을 수 없습니다.",
      });
    }

    if (String(application.applicant) !== String(userId)) {
      return res.status(403).json({
        status: "fail",
        message: "본인 지원 정보만 수정할 수 있습니다.",
      });
    }

    const { role, motivation, status } = req.body;

    if (role !== undefined) application.role = role;
    if (motivation !== undefined) application.motivation = motivation;
    if (status !== undefined) application.status = status;

    await application.save();

    return res.status(200).json({ status: "success", application });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

applicationController.deleteApplication = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { userId } = req;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        status: "fail",
        message: "유효하지 않은 지원 아이디입니다.",
      });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        status: "fail",
        message: "지원 정보를 찾을 수 없습니다.",
      });
    }

    if (String(application.applicant) !== String(userId)) {
      return res.status(403).json({
        status: "fail",
        message: "본인 지원 정보만 삭제할 수 있습니다.",
      });
    }

    await Application.deleteOne({ _id: applicationId });

    return res.status(200).json({ status: "success" });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};
// id (userId)
applicationController.getMyApplication = async (req, res) => {
  try {
    const { userId } = req;

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, PAGE_SIZE);
    const sort =
      req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const condition = { applicant: userId };
    const totalCount = await Application.countDocuments(condition);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const applications = await Application.find(condition)
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("project", "title status deadline recruitRoles")
      .populate(
        "applicant",
        "name profile.techStack profile.profileImage profile.bio profile.gitUrl",
      );

    return res
      .status(200)
      .json({ status: "success", data: applications, totalPages, totalCount });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};
applicationController.updateApplicantStatus = async (req, res) => {
  try {
    const { userId } = req;
    const { status } = req.body;
    const applicationId = req.params.id;

    const application =
      await Application.findById(applicationId).populate("project");

    if (!application) {
      return res
        .status(404)
        .json({ status: "fail", message: "지원 정보를 찾을 수 없습니다." });
    }

    if (String(userId) !== String(application.project.author)) {
      return res.status(403).json({
        status: "fail",
        message: "권한이 없습니다. 리더만 처리 가능합니다.",
      });
    }

    if (application.status === status) {
      return res
        .status(400)
        .json({ status: "fail", message: "이미 처리된 상태입니다." });
    }

    if (status === "APPROVED") {
      const targetProject = await Project.findById(application.project._id);

      const roleIndex = targetProject.recruitRoles.findIndex(
        (r) => r.role === application.role,
      );

      if (roleIndex === -1) {
        return res
          .status(400)
          .json({ status: "fail", message: "해당 역할을 찾을 수 없습니다." });
      }

      const roleInfo = targetProject.recruitRoles[roleIndex];

      const approvedCount = await Application.countDocuments({
        project: application.project._id,
        role: application.role,
        status: { $in: ["APPROVED", "ACCEPTED"] },
      });

      if (approvedCount >= roleInfo.cnt) {
        return res.status(400).json({
          status: "fail",
          message: `${application.role} 포지션은 이미 정원이 가득 찼습니다.`,
        });
      }

      targetProject.recruitRoles[roleIndex].currentCnt = approvedCount + 1;
      await targetProject.save();
    }

    if (status === "REJECTED") {
      const wasApproved =
        application.status === "APPROVED" || application.status === "ACCEPTED";
      if (wasApproved) {
        const targetProject = await Project.findById(application.project._id);
        const roleIndex = targetProject.recruitRoles.findIndex(
          (r) => r.role === application.role,
        );
        if (roleIndex !== -1) {
          const approvedCountAfterReject = await Application.countDocuments({
            project: application.project._id,
            role: application.role,
            status: { $in: ["APPROVED", "ACCEPTED"] },
            _id: { $ne: applicationId },
          });
          targetProject.recruitRoles[roleIndex].currentCnt =
            approvedCountAfterReject;
          await targetProject.save();
        }
      }
    }
    application.status = status;
    await application.save();
    // 지원 상태 거절 및 승인 시 알람
    try {
      await notiController.createNotification({
        receiver: application.applicant,
        actor: userId,
        relatedProject: application.project._id,
        relatedApplication: application._id,
        messageType:
          status === "APPROVED"
            ? "APPLICATION_APPROVED"
            : "APPLICATION_REJECTED",
      });
    } catch (error) {
      console.log(error);
    }
    return res.status(200).json({ status: "success", data: application });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};
module.exports = applicationController;
