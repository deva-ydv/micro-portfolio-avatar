const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Link title is required"],
      trim: true,
      maxlength: 80,
    },
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
      match: [/^https?:\/\/.+/, "URL must start with http:// or https://"],
    },
    icon: {
      type: String, // e.g. "github", "twitter", "instagram" - frontend maps to an icon
      default: "link",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

linkSchema.index({ user: 1, order: 1 });

module.exports = mongoose.model("Link", linkSchema);
