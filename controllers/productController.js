const { StatusCodes } = require("http-status-codes");
const Product = require("../models/Product");
const { BadRequestError, NotFoundError } = require("../errors");
const path = require("path");
const Review = require("../models/Review");

const createProduct = async (request, response) => {
  request.body.user = request.user.userId;
  const product = await Product.create(request.body);
  response.status(StatusCodes.CREATED).json({ product });
};

const getAllProducts = async (request, response) => {
  const products = await Product.find({}).populate({
    path: "user",
    select: "name",
  });
  response.status(StatusCodes.OK).json({ products, nbHits: products.length });
};

const getSingleProduct = async (request, response) => {
  const { id: productId } = request.params;
  const product = await Product.findOne({ _id: productId }).populate("reviews");
  if (!product) {
    throw new NotFoundError(`No product with id: ${productId}!`);
  }
  response.status(StatusCodes.OK).json({ product });
};

const updateProduct = async (request, response) => {
  const { id: productId } = request.params;
  const product = await Product.findOneAndUpdate(
    { _id: productId },
    request.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!product) {
    throw new NotFoundError(`No product with id: ${productId}!`);
  }
  response.status(StatusCodes.OK).json({ product });
};

const deleteProduct = async (request, response) => {
  const { id: productId } = request.params;
  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new NotFoundError(`No product with id ${productId}!`);
  }
  await product.remove();

  // Deleting all reviews associated with this product
  // await Review.deleteMany({ product: productId });

  response.status(StatusCodes.OK).json({ msg: "Product deleted!" });
};

const uploadImage = async (request, response) => {
  if (!request.files) {
    throw new BadRequestError("Please, upload a file!");
  }
  const productImage = request.files.image;
  if (!productImage.mimetype.startsWith("image")) {
    throw new BadRequestError("Please, upload an image!");
  }
  if (productImage.size > 1024 * 1024) {
    throw new BadRequestError("Please, upload a image smaller than 1MB!");
  }
  const imagePath = path.join(
    __dirname,
    "../public/uploads/" + `${productImage.name}`
  );
  await productImage.mv(imagePath);
  response
    .status(StatusCodes.OK)
    .json({ image: { src: `/uploads/${productImage.name}` } });
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
};
