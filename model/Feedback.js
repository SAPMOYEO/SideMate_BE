const mongoose = require("mongoose");
const Project = require("./Project");
const Schema = mongoose.Schema;

const feedbackSchema = Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Project,
    },
    tempProjectId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    strengths: {
      type: Date,
      required: true,
    },
    weaknesses: {
      type: Date,
      required: true,
    },
    suggestions: {
      type: [String],
      required: true,
    },
    fullResponse: {
      type: [String],
      required: true,
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
