const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: Array,
  total: Number,
  mode: String,
  customerName: String,
  phone: String,
  address: String,
  heureRetrait: String,
  status: { type: String, default: 'En attente' },
  userId: { type: String }, // 👈 LA LIGNE MAGIQUE QUI RELIE LA COMMANDE AU CLIENT
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);