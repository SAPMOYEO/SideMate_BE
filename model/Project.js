const mongoose = require("mongoose");
const User = require("./User");
const Schema = mongoose.Schema;

const projectSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    goal: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    requiredTechStack: {
      type: [String],
      required: true,
    },
    // mandatoryTechStack: {
    //   type: [String],
    //   required: true,
    // },
    recruitRoles: {
      type: [
        {
          role: {
            type: String,
            required: true,
          },
          cnt: {
            type: Number,
            required: true,
          },
        },
      ],
      required: true,
    },
    totalCnt: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    communicationMethod: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.ObjectId,
      ref: User,
      required: true,
    },
    gitUrl: {
      type: String,
    },
    aiFeedbackIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Feedback",
    },
    hiddenYn: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true },
);

projectSchema.method.toJSON = function () {
  const obj = this._doc;
  delete obj._v;

  return obj;
};

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
