const { StatusCodes } = require("http-status-codes");
const Review = require("../models/Review");
const Product = require("../models/Product");
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../errors");
const { checkPermissions } = require("../utils/jwt");

const createReview = async (request, response) => {
  const { product: productId } = request.body;
  // Checking if the product exists
  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new NotFoundError(`No product with id: ${productId}`);
  }

  // Checking if the user already submitted a review for this product
  const alreadyReviewed = await Review.findOne({
    product: productId,
    user: request.user.userId,
  });

  if (alreadyReviewed) {
    throw new BadRequestError(
      "You already submitted a review for this product!"
    );
  }

  request.body.product = productId;
  request.body.user = request.user.userId;
  const review = await Review.create(request.body);
  response.status(StatusCodes.CREATED).json({ review });
};

const getAllReviews = async (request, response) => {
  const reviews = await Review.find({}).populate({
    path: "product",
    select: "name company price",
  });
  response.status(StatusCodes.OK).json({ reviews, nbHits: reviews.length });
};

const getSingleReview = async (request, response) => {
  const { id: reviewId } = request.params;
  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new NotFoundError(`No review with id: ${reviewId}`);
  }
  response.status(StatusCodes.OK).json({ review });
};

const updateReview = async (request, response) => {
  const { title, comment, rating } = request.body;
  const { id: reviewId } = request.params;
  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new NotFoundError(`No review with id: ${reviewId}`);
  }

  checkPermissions(request.user, review.user);

  review.title = title;
  review.comment = comment;
  review.rating = rating;

  await review.save();

  response.status(StatusCodes.OK).json({ review });
};

const deleteReview = async (request, response) => {
  const { id: reviewId } = request.params;

  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new NotFoundError(`No review with id: ${reviewId}`);
  }

  checkPermissions(request.user, review.user);

  await review.remove();
  response.status(StatusCodes.OK).json({ msg: "Review deleted!" });
};

const getSingleProductReviews = async (request, response) => {
  const { id: productId } = request.params;
  const reviews = await Review.find({ product: productId });

  response.status(StatusCodes.OK).json({ reviews, nbHits: reviews.length });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
};
