const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

bannerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Banner = mongoose.model("Banner", bannerSchema);
module.exports = Banner;
