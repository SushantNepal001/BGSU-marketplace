const crypto = require("crypto");
const express = require("express");
const RemixJob = require("../models/RemixJob");
const { createRemix, getRemixStatus } = require("../services/magicHourClient");

const router = express.Router();

const allowedStyles = new Set([
  "fake-product-trailer",
  "roast-video",
  "anime-intro",
  "meme-pack",
  "ai-thinks-your-life",
]);

const normalizeStatus = (status) => {
  if (!status) return "processing";
  const value = status.toLowerCase();
  if (["queued", "processing", "running", "in_progress"].includes(value)) {
    return "processing";
  }
  if (["done", "completed", "success", "succeeded"].includes(value)) {
    return "done";
  }
  if (["failed", "error", "cancelled", "canceled"].includes(value)) {
    return "failed";
  }
  return "processing";
};

const toResponse = (job) => ({
  id: job._id,
  shareSlug: job.shareSlug,
  style: job.style,
  status: job.status,
  sourcePlatform: job.sourcePlatform,
  sourceHandle: job.sourceHandle,
  listingSnapshot: job.listingSnapshot,
  resultUrl: job.resultUrl,
  thumbnailUrl: job.thumbnailUrl,
  errorMessage: job.errorMessage,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
});

router.post("/", async (req, res, next) => {
  try {
    const {
      style = "fake-product-trailer",
      sourcePlatform = "listing",
      sourceHandle = "",
      listingSnapshot,
    } = req.body || {};

    if (!allowedStyles.has(style)) {
      return res.status(400).json({
        success: false,
        message: "Invalid style",
      });
    }

    if (!listingSnapshot || !listingSnapshot.title) {
      return res.status(400).json({
        success: false,
        message: "listingSnapshot.title is required",
      });
    }

    const shareSlug = crypto.randomBytes(6).toString("base64url");

    const job = await RemixJob.create({
      style,
      sourcePlatform,
      sourceHandle,
      listingSnapshot,
      status: "queued",
      shareSlug,
    });

    const providerResponse = await createRemix({
      style,
      listingSnapshot,
      sourceHandle,
      sourcePlatform,
    });

    job.providerJobId = providerResponse.providerJobId;
    job.status = normalizeStatus(providerResponse.status);
    job.meta = {
      ...job.meta,
      ...providerResponse.meta,
    };
    await job.save();

    return res.status(201).json({
      success: true,
      data: toResponse(job),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/share/:slug", async (req, res, next) => {
  try {
    const job = await RemixJob.findOne({ shareSlug: req.params.slug }).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Remix share not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const job = await RemixJob.findById(req.params.id).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Remix job not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/refresh", async (req, res, next) => {
  try {
    const job = await RemixJob.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Remix job not found",
      });
    }

    if (!job.providerJobId) {
      return res.status(400).json({
        success: false,
        message: "Provider job id is not available",
      });
    }

    const statusData = await getRemixStatus(job.providerJobId, job.meta || {});

    job.status = normalizeStatus(statusData.status);
    job.resultUrl = statusData.resultUrl || job.resultUrl;
    job.thumbnailUrl = statusData.thumbnailUrl || job.thumbnailUrl;
    job.meta = {
      ...job.meta,
      ...statusData.meta,
    };

    if (job.status === "failed" && !job.errorMessage) {
      job.errorMessage = "Remix generation failed at provider";
    }

    await job.save();

    return res.status(200).json({
      success: true,
      data: toResponse(job),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
