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
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
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
      default: "FREE",
    },
    marketingAgree: {
      type: Boolean,
      default: false,
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
