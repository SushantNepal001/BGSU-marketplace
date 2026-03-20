const express = require("express");
const protect = require("../middleware/auth");

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
});

module.exports = router;
