const mongoose = require("mongoose");

const STYLE_VALUES = [
  "fake-product-trailer",
  "roast-video",
  "anime-intro",
  "meme-pack",
  "ai-thinks-your-life",
];

const STATUS_VALUES = ["queued", "processing", "done", "failed"];

const remixJobSchema = new mongoose.Schema(
  {
    sourcePlatform: {
      type: String,
      enum: ["listing", "twitter", "instagram"],
      default: "listing",
    },
    sourceHandle: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    listingSnapshot: {
      listingId: { type: String, default: "" },
      title: { type: String, required: true, trim: true, maxlength: 160 },
      description: { type: String, default: "", maxlength: 800 },
      price: { type: Number, min: 0, default: null },
      imageUrl: { type: String, default: "" },
      listingUrl: { type: String, default: "" },
    },
    style: {
      type: String,
      enum: STYLE_VALUES,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: "queued",
      index: true,
    },
    prompt: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    provider: {
      type: String,
      default: "magic-hour",
    },
    providerJobId: {
      type: String,
      default: "",
      index: true,
    },
    resultUrl: {
      type: String,
      default: "",
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    shareSlug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    errorMessage: {
      type: String,
      default: "",
      maxlength: 1200,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("RemixJob", remixJobSchema);
