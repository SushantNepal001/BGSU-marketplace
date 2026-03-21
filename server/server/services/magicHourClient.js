const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { Client, ApiError } = require("magic-hour");

const ALLOW_MOCK_ON_ERROR = process.env.MAGIC_HOUR_ALLOW_MOCK_ON_ERROR !== "false";

const getClient = () => {
  const apiKey = process.env.MAGIC_HOUR_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Client({ token: apiKey });
};

const parseProviderError = async (error, fallbackMessage) => {
  if (error instanceof ApiError) {
    try {
      const data = await error.response.json();
      return {
        message: data?.message || error.message || fallbackMessage,
        statusCode: error.statusCode || error?.response?.status,
        details: data,
      };
    } catch (_) {
      return {
        message: error.message || fallbackMessage,
        statusCode: error.statusCode || error?.response?.status,
        details: null,
      };
    }
  }

  return {
    message: error?.message || fallbackMessage,
    statusCode: error?.statusCode || error?.status,
    details: error?.details || null,
  };
};

const hasSupportedImageExtension = (value) =>
  /\.(png|jpe?g|heic|webp|avif|jp2|tiff|bmp)(\?|$)/i.test(value || "");

const getExtensionFromContentType = (contentType) => {
  const normalized = (contentType || "").toLowerCase();
  if (normalized.includes("image/png")) return "png";
  if (normalized.includes("image/webp")) return "webp";
  if (normalized.includes("image/avif")) return "avif";
  if (normalized.includes("image/heic")) return "heic";
  if (normalized.includes("image/tiff")) return "tiff";
  if (normalized.includes("image/bmp")) return "bmp";
  if (normalized.includes("image/jp2")) return "jp2";
  return "jpg";
};

const downloadImageToTemp = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to download image URL (${response.status})`);
  }

  const extension = getExtensionFromContentType(response.headers.get("content-type"));
  const tempPath = path.join(os.tmpdir(), `magic-hour-${Date.now()}.${extension}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(tempPath, buffer);
  return tempPath;
};

const resolveImageFilePath = async (imageUrl, client) => {
  if (!imageUrl) {
    throw new Error("Image URL is required for remix generation");
  }

  if (imageUrl.startsWith("api-assets/")) {
    return imageUrl;
  }

  if (/^https?:\/\//i.test(imageUrl) && hasSupportedImageExtension(imageUrl)) {
    return imageUrl;
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    const tempPath = await downloadImageToTemp(imageUrl);
    try {
      return await client.v1.files.uploadFile(tempPath);
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }
  }

  return client.v1.files.uploadFile(imageUrl);
};

const getStyleTemplate = (style) => {
  const map = {
    "fake-product-trailer": "Create a dramatic cinematic trailer for this marketplace product.",
    "roast-video": "Create a playful roast-style short clip for this product.",
    "anime-intro": "Create an anime-style intro sequence for this product.",
    "meme-pack": "Create a meme-driven short trailer for this product.",
    "ai-thinks-your-life": "Create a humorous \"AI thinks your life looks like this\" trailer for this product.",
  };

  return map[style] || map["fake-product-trailer"];
};

const createMagicHourPayload = ({
  style,
  listingSnapshot,
  sourceHandle,
  sourcePlatform,
  imageFilePath,
}) => {
  const basePrompt = getStyleTemplate(style);
  const priceLine = typeof listingSnapshot.price === "number" ? `Price: $${listingSnapshot.price}.` : "";

  const combinedPrompt = [
      basePrompt,
      `Product: ${listingSnapshot.title}.`,
      listingSnapshot.description,
      priceLine,
      listingSnapshot.listingUrl ? `Product link: ${listingSnapshot.listingUrl}.` : "",
      sourceHandle ? `Creator handle: ${sourceHandle} (${sourcePlatform}).` : "",
      "Include a short ending CTA: Available now on Falcon Marketplace.",
    ]
    .filter(Boolean)
    .join(" ");

  return {
    name: `Falcon Remix - ${listingSnapshot.title}`,
    // Keep this intentionally low-cost for hackathon/free-tier usage.
    model: "ltx-2",
    resolution: "480p",
    endSeconds: 3,
    style: {
      prompt: combinedPrompt,
    },
    assets: {
      imageFilePath,
    },
  };
};

const createRemix = async (input) => {
  const client = getClient();

  if (!client) {
    // Mock mode keeps local development moving before API keys are configured.
    return {
      providerJobId: `mock-${Date.now()}`,
      status: "processing",
      meta: { mock: true },
    };
  }

  try {
    const imageFilePath = await resolveImageFilePath(input.listingSnapshot.imageUrl, client);

    const data = await client.v1.imageToVideo.create(
      createMagicHourPayload({
        ...input,
        imageFilePath,
      }),
    );

    return {
      providerJobId: data.id || data.jobId || "",
      status: "processing",
      meta: data,
    };
  } catch (error) {
    const providerError = await parseProviderError(error, "Magic Hour create remix request failed");

    if (!ALLOW_MOCK_ON_ERROR) {
      const upstreamError = new Error(providerError.message);
      upstreamError.status = providerError.statusCode || 502;
      upstreamError.statusCode = providerError.statusCode || 502;
      upstreamError.details = providerError.details;
      throw upstreamError;
    }

    return {
      providerJobId: `mock-${Date.now()}`,
      status: "processing",
      meta: {
        mock: true,
        fallbackReason: providerError.message,
      },
    };
  }
};

const getRemixStatus = async (providerJobId, existingMeta = {}) => {
  const client = getClient();

  if (!client) {
    const createdAt = existingMeta.mockCreatedAt || Date.now();
    const ageMs = Date.now() - createdAt;
    const done = ageMs > 5000;

    return {
      status: done ? "done" : "processing",
      resultUrl: done
        ? "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
        : "",
      thumbnailUrl: done
        ? "https://images.unsplash.com/photo-1512427691650-4180b2d4c5f0?auto=format&fit=crop&w=800&q=60"
        : "",
      meta: {
        ...existingMeta,
        mock: true,
        mockCreatedAt: createdAt,
      },
    };
  }

  try {
    const data = await client.v1.videoProjects.get({ id: providerJobId });

    return {
      status:
        data.status === "complete"
          ? "done"
          : data.status === "error" || data.status === "canceled"
            ? "failed"
            : "processing",
      resultUrl: data.downloads?.[0]?.url || data.download?.url || "",
      thumbnailUrl: "",
      meta: data,
    };
  } catch (error) {
    const providerError = await parseProviderError(error, "Magic Hour status request failed");

    if (!ALLOW_MOCK_ON_ERROR) {
      const upstreamError = new Error(providerError.message);
      upstreamError.status = providerError.statusCode || 502;
      upstreamError.statusCode = providerError.statusCode || 502;
      upstreamError.details = providerError.details;
      throw upstreamError;
    }

    const createdAt = existingMeta.mockCreatedAt || Date.now();
    const ageMs = Date.now() - createdAt;
    const done = ageMs > 7000;

    return {
      status: done ? "done" : "processing",
      resultUrl: done
        ? "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
        : "",
      thumbnailUrl: done
        ? "https://images.unsplash.com/photo-1512427691650-4180b2d4c5f0?auto=format&fit=crop&w=800&q=60"
        : "",
      meta: {
        ...existingMeta,
        mock: true,
        mockCreatedAt: createdAt,
        fallbackReason: providerError.message,
      },
    };
  }
};

module.exports = {
  createRemix,
  getRemixStatus,
};
