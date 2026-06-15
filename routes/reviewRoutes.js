const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");

const {
  submitReview,
  getMyReview,
  getAllReviews,
  getReviewStats,
  deleteReview,
} = require("../controllers/reviewController");

// Customer routes
router.post("/", protect, submitReview);
// router.get("/my", protect, getMyReview);
// GET /reviews/my — logged-in customer ka review fetch karo
router.get("/my", protect, async (req, res) => {
  try {
    const review = await Review.findOne({ customer: req.user._id });
    if (!review) {
      return res.json({ hasReviewed: false, data: null });
    }
    return res.json({ hasReviewed: true, data: review });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin routes
router.get("/all", protect, restrictTo("admin"), getAllReviews);
router.get("/stats", protect, restrictTo("admin"), getReviewStats);
router.delete("/:id", protect, restrictTo("admin"), deleteReview);

module.exports = router;