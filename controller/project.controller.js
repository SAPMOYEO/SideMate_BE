const Project = require("../model/Project");
const Feedback = require("../model/Feedback");
const PAGE_SIZE = Number(process.env.PROJECT_PAGE_SIZE) || 5;
const projectController = {};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim());
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim());
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

const toSingle = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  if (value && typeof value === "object") {
    const values = Object.values(value);
    return values[0];
  }

  return value;
};

const parseDate = (value, endOfDay = false) => {
  if (!value || typeof value !== "string") return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
};

projectController.createProject = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      goal,
      startDate,
      endDate,
      requiredTechStack,
      recruitRoles,
      totalCnt,
      deadline,
      communicationMethod,
      status,
      gitUrl,
      aiFeedbackIds,
      tempProjectId,
    } = req.body;

    const { userId } = req;
    const project = new Project({
      title,
      category,
      description,
      goal,
      startDate,
      endDate,
      requiredTechStack,
      recruitRoles,
      totalCnt,
      deadline,
      communicationMethod,
      status,
      gitUrl,
      aiFeedbackIds,
      author: userId,
    });

    await project.save();

    // 생성 전 draft 상태로 저장된 AI 피드백을 실제 프로젝트에 연결
    if (tempProjectId) {
      await Feedback.updateMany(
        {
          user: userId,
          tempProjectId,
          project: null,
        },
        {
          $set: { project: project._id },
        },
      );
    }

    return res.status(200).json({ status: "success", project });
  } catch (error) {
    console.error("createProject error:", error);
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

projectController.getProjects = async (req, res) => {
  try {
    const filter =
      req.query && typeof req.query.filter === "object" && req.query.filter !== null
        ? req.query.filter
        : req.query;

    const pageRaw = Number(toSingle(filter.page));
    const limitRaw = Number(toSingle(filter.limit));
    const sortRaw = toSingle(filter.sort);
    const title = toSingle(filter.title);
    const category = toArray(filter.category);
    const requiredTechStack = toArray(filter.requiredTechStack);
    const status = toSingle(filter.status);

    const startDate = parseDate(toSingle(filter.startDate));
    const endDate = parseDate(toSingle(filter.endDate), true);
    const deadlineStartDate = parseDate(toSingle(filter.deadlineStartDate));
    const deadlineEndDate = parseDate(toSingle(filter.deadlineEndDate), true);

    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? limitRaw : PAGE_SIZE;
    const sort = sortRaw === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const condition = { hiddenYn: false };

    if (typeof title === "string" && title.trim()) {
      condition.title = { $regex: title.trim(), $options: "i" };
    }

    if (category.length) {
      condition.category = { $in: category };
    }

    if (requiredTechStack.length) {
      condition.requiredTechStack = { $in: requiredTechStack };
    }

    if (typeof status === "string" && status.trim()) {
      condition.status = status.trim();
    }

    if (startDate) {
      condition.startDate = { ...(condition.startDate || {}), $gte: startDate };
    }

    if (endDate) {
      condition.endDate = { ...(condition.endDate || {}), $lte: endDate };
    }

    if (deadlineStartDate || deadlineEndDate) {
      condition.deadline = {};

      if (deadlineStartDate) {
        condition.deadline.$gte = deadlineStartDate;
      }

      if (deadlineEndDate) {
        condition.deadline.$lte = deadlineEndDate;
      }
    }

    const totalCount = await Project.countDocuments(condition);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const projectList = await Project.find(condition)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name email")
      .exec();

    return res.status(200).json({
      status: "success",
      data: projectList,
      totalCount,
      totalPages,
      totalPageNum: totalPages,
    });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

projectController.getProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId).populate("author", "name email");

    if (project) {
      return res.status(200).json({ status: "success", data: project });
    }

    throw new Error("Project not found");
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

projectController.updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const {
      title,
      category,
      description,
      goal,
      startDate,
      endDate,
      requiredTechStack,
      recruitRoles,
      totalCnt,
      deadline,
      communicationMethod,
      status,
      gitUrl,
      aiFeedbackIds,
    } = req.body;

    const { userId } = req;
    const project = await Project.findByIdAndUpdate(
      { _id: projectId },
      {
        title,
        category,
        description,
        goal,
        startDate,
        endDate,
        requiredTechStack,
        recruitRoles,
        totalCnt,
        deadline,
        communicationMethod,
        status,
        gitUrl,
        aiFeedbackIds,
        author: userId,
      },
      { new: true },
    );

    return res.status(200).json({ status: "success", project });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

projectController.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    await Project.findByIdAndDelete(projectId);

    return res.status(200).json({ status: "success" });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

projectController.getProjectByMe = async (req, res) => {
  try {
    const { userId } = req;
    const page =
      Number.isInteger(Number(req.query.page)) && Number(req.query.page) > 0
        ? Number(req.query.page)
        : 1;
    const limit =
      Number.isInteger(Number(req.query.limit)) && Number(req.query.limit) > 0
        ? Number(req.query.limit)
        : PAGE_SIZE;

    const condition = { author: userId };
    const totalCount = await Project.countDocuments(condition);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const myProject = await Project.find({ author: userId })
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json({ status: "success", data: myProject, totalCount, totalPages });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};
module.exports = projectController;
