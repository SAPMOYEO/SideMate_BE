const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const userSchema = Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: true,
      default: "user",
    },
    profile: {
      type: {
        profileImage: {
          type: String,
        },
        bio: {
          type: String,
        },
        techStack: {
          type: [String],
          default: [],
        },
        gitUrl: {
          type: String,
        },
      },
    },
    tier: {
      type: String,
      required: true,
      enum: ["FREE", "BASIC", "PREMIUM"],
      default: "FREE",
    },
    marketingAgree: {
      type: Boolean,
      default: false,
    },
    privacySettings: {
      isImagePublic: { type: Boolean, default: false },
      isEmailPublic: { type: Boolean, default: false },
      isGithubPublic: { type: Boolean, default: false },
      isBioPublic: { type: Boolean, default: false },
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ["local", "google"],
      default: "local",
    },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj._v;

  return obj;
};

userSchema.methods.generateToken = async function () {
  const token = await jwt.sign({ _id: this._id }, JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
  return token;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
