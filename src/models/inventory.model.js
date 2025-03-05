const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  stock: { type: Number, required: true }, // Available stock
});

module.exports = mongoose.model("Inventory", InventorySchema);
