const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    imageUrl: {
      type: String,
      require: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
    },
  },
  { timestamps: true },
);

bannerSchema.method.toJSON = function () {
  const obj = this._doc;
  delete obj._v;

  return obj;
};

const Banner = mongoose.model("Banner", bannerSchema);
module.exports = Banner;
