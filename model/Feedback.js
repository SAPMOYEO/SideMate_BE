const mongoose = require("mongoose");
const Project = require("./Project");
const User = require("./User");
const Schema = mongoose.Schema;

const feedbackSchema = Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
      index: true,
    },
    project: {
      // 생성 된 프로젝트, 생성전이라면 null
      // 생성 후 실제 프로젝트 오브젝트아이디 연결
      type: mongoose.Schema.Types.ObjectId,
      ref: Project,
      default: null,
      index: true,
    },
    tempProjectId: {
      // 생성전/후 프로젝트
      type: String,
      index: true,
      required: true,
    },
    type: {
      // 피드백 받는 위치 타입
      // 생성전 : project-create-draft(), 생성후 : project-detail
      type: String,
      required: true,
    },
    overallComment: {
      type: String,
      required: true,
      default: "",
    },
    strengths: {
      type: [String],
      default: [],
      required: true,
    },
    weaknesses: {
      type: [String],
      default: [],
      required: true,
    },
    suggestions: {
      type: [String],
      default: [],
      required: true,
    },
    suggestions: {
      type: [String],
      default: [],
      required: true,
    },
    fullResponse: {
      type: [String],
      default: [],
      required: true,
    },

    // ai 피드백 버튼 눌렀을 당시 프로젝트 작성 내용
    inputSnapshot: {
      title: { type: String, required: true },
      category: { type: String, required: true },
      description: { type: String, required: true },
      goal: { type: String, required: true },

      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },

      requiredTechStack: { type: [String], default: [] },
      // mandatoryTechStack: { type: [String], default: [] },

      recruitRoles: [
        {
          role: { type: String, required: true },
          cnt: { type: Number, required: true },
        },
      ],

      totalCnt: { type: Number, required: true },

      deadline: { type: Date, required: true },

      communicationMethod: { type: String, required: true },

      gitUrl: { type: String },
    },
  },
  { timestamps: true },
);

feedbackSchema.method.toJSON = function () {
  const obj = this._doc;
  delete obj._v;

  return obj;
};

const Feedback = mongoose.model("Feedback", feedbackSchema);
module.exports = Feedback;
