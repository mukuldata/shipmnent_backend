const Inventory = require("../models/inventory.model");

// Check if items are in stock
const checkStockAvailability = async (items) => {
  const unavailableItems = [];

  for (const item of items) {
    const product = await Inventory.findOne({ productId: item.productId });

    if (!product || product.stock < item.quantity) {
      unavailableItems.push({
        productId: item.productId,
        name: item.name,
        availableStock: product ? product.stock : 0,
      });
    }
  }

  return unavailableItems;
};

// Deduct stock after successful order placement
const updateStockLevels = async (items) => {
  for (const item of items) {
    await Inventory.updateOne(
      { productId: item.productId },
      { $inc: { stock: -item.quantity } } // Deduct stock
    );
  }
};

module.exports = { checkStockAvailability, updateStockLevels };
