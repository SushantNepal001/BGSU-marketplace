/**
 * Middleware to validate BGSU email addresses
 */
const validateBGSUEmail = (req, res, next) => {
  const { userEmail } = req.body;

  if (!userEmail) {
    return res.status(400).json({
      success: false,
      message: "User email is required",
    });
  }

  // Validate email format and BGSU domain
  const bgsuEmailRegex = /.+@bgsu\.edu$/i;

  if (!bgsuEmailRegex.test(userEmail)) {
    return res.status(400).json({
      success: false,
      message:
        "Email must be a valid BGSU email address (ending with @bgsu.edu)",
    });
  }

  next();
};

module.exports = validateBGSUEmail;
