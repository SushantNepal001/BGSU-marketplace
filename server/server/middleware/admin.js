const requireAdmin = (req, res, next) => {
  const configuredAdmins = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const requestUserEmail = String(req.user?.email || "").toLowerCase();

  if (!requestUserEmail || !configuredAdmins.includes(requestUserEmail)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: admin access required",
    });
  }

  return next();
};

module.exports = requireAdmin;
