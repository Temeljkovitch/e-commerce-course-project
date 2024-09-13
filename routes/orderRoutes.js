const express = require("express");
const {
  getAllOrders,
  getSingleOrder,
  updateOrder,
  createOrder,
  getCurrentUserOrders,
} = require("../controllers/orderController");
const {
  authentication,
  authorization,
} = require("../middleware/authentication");
const router = express.Router();

router
  .route("/")
  .get(authentication, authorization("admin"), getAllOrders)
  .post(authentication, createOrder);
router.route("/showAllMyOrders").get(authentication, getCurrentUserOrders);
router
  .route("/:id")
  .get(authentication, getSingleOrder)
  .patch(authentication, updateOrder);

module.exports = router;
