const express = require("express");
const {
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  getSingleReview,
} = require("../controllers/reviewController");
const { authentication } = require("../middleware/authentication");
const router = express.Router();

router.route("/").get(getAllReviews).post(authentication, createReview);
router
  .route("/:id")
  .get(getSingleReview)
  .patch(authentication, updateReview)
  .delete(authentication, deleteReview);

module.exports = router;
