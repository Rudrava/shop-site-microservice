const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  products: [{ productId: String }],
  user: { email: String },
  total_price: Number,
  CreatedAt: { type: Date, default: Date.now() },
});

module.exports = Order = mongoose.model("order", OrderSchema);
