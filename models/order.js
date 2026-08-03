const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    client: {
        nom: String,
        telephone: String,
        ville: String,
        adresse: String
    },
    articles: Array,       // La liste des pizzas et boissons commandées
    total: Number,         // Le montant total en euros
    mode: String,          // 'livraison' ou 'emporter'
    statut: { type: String, default: 'en_attente' }, // en_attente, en_preparation, prete
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);