const express = require("express");
const {
  getAllProducts,
  createProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} = require("../controllers/productController");
const {
  authorization,
  authentication,
} = require("../middleware/authentication");
const { getSingleProductReviews } = require("../controllers/reviewController");
const router = express.Router();

router
  .route("/")
  .get(getAllProducts)
  .post([authentication, authorization("admin")], createProduct);

router
  .route("/uploadImage")
  .post([authentication, authorization("admin")], uploadImage);

router
  .route("/:id")
  .get(getSingleProduct)
  .patch([authentication, authorization("admin")], updateProduct)
  .delete([authentication, authorization("admin")], deleteProduct);

router.route("/:id/reviews").get(getSingleProductReviews);

module.exports = router;
