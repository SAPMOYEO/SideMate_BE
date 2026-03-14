const mongoose = require("mongoose");
const User = require("./User");
const Project = require("./Project");
const Application = require("./Application");
const Schema = mongoose.Schema;

const MESSAGE_TYPES = [
  "NEW_APPLICANT",
  "APPLICATION_APPROVED",
  "APPLICATION_REJECTED",
  "AI_FEEDBACK_DEPLETED",
  "AI_RESET_REMINDER",
];

const notificationSchema = Schema(
  {
    receiver: {
      type: mongoose.ObjectId,
      ref: User,
      required: true,
    },
    //   발생자
    actor: {
      type: mongoose.ObjectId,
      ref: User,
      required: true,
    },
    relatedProject: {
      type: mongoose.ObjectId,
      ref: Project,
    },
    relatedApplication: {
      type: mongoose.ObjectId,
      ref: Application,
    },
    messageType: { type: String, enum: MESSAGE_TYPES, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj._v;

  return obj;
};

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
