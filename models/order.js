const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  status: { type: String, default: 'En attente' },
  createdAt: { type: Date, default: Date.now } // Date et heure automatiques
});

module.exports = mongoose.model('Order', orderSchema);