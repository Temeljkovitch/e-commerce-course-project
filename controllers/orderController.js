const Order = require("../models/Order");
const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");
const { checkPermissions } = require("../utils/jwt");

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = "someRandomValue";
  return { client_secret, amount };
};

const getAllOrders = async (request, response) => {
  const orders = await Order.find({});
  response.status(StatusCodes.OK).json({ orders, nbHits: orders.length });
};

const getSingleOrder = async (request, response) => {
  const { id: orderId } = request.params;
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new NotFoundError(`No order with id: ${orderId}`);
  }
  checkPermissions(request.user, order.user);
  response.status(StatusCodes.OK).json({ order });
};

const getCurrentUserOrders = async (request, response) => {
  const orders = await Order.find({ user: request.user.userId });
  response.status(StatusCodes.OK).json({ orders, nbHits: orders.length });
};

const createOrder = async (request, response) => {
  const { items: cartItems, tax, shippingFee } = request.body;

  if (!cartItems || cartItems.length < 1) {
    throw new BadRequestError("No cart items provided!");
  }

  if (!tax || !shippingFee) {
    throw new BadRequestError("Please, provide tax and shipping fee!");
  }

  let orderItems = [];
  let subTotal = 0;

  for (const item of cartItems) {
    console.log(item);
    const dbProduct = await Product.findOne({
      _id: item.product,
    });
    if (!dbProduct) {
      throw new NotFoundError(`No product with id: ${item.product}`);
    }
    const { name, price, image, _id } = dbProduct;
    const singleOrderItem = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };
    // Add current item to orderItems array
    orderItems = [...orderItems, singleOrderItem];
    // Calculate subtotal
    subTotal += price * item.amount;
  }
  // Calculate total
  const total = tax + shippingFee + subTotal;

  // Get client secret
  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: "usd",
  });

  const order = await Order.create({
    orderItems,
    total,
    subTotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: request.user.userId,
  });

  response
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};

const updateOrder = async (request, response) => {
  const { id: orderId } = request.params;
  const { paymentIntentId } = request.body;
  const order = await Order.findOneAndUpdate({ _id: orderId }, request.body, {
    new: true,
    runValidators: true,
  });
  if (!order) {
    throw new NotFoundError(`No order with id: ${orderId}`);
  }
  checkPermissions(request.user, order.user);

  order.paymentId = paymentIntentId;
  order.status = "paid";
  await order.save()
  
  response.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
