const express = require("express");
const { createOrder, getOrder } = require("../controllers/order.controller");
const { authenticateUser } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authenticateUser, createOrder);
router.get("/:id", authenticateUser, getOrder);

module.exports = router;
