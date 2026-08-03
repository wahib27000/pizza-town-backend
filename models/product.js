const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  desc: { type: String, required: true },
  categorie: { type: String, required: true },
  image: { type: String, default: 'images/defaut.jpg' },
  prixBase: { type: Number }, // Pour les pizzas (avec tailles Junior/Senior/Méga)
  prixFixe: { type: Number }, // Pour les autres articles (salades, boissons, etc.)
  createdAt: { type: Date, default: Date.now } // Permet de calculer le badge "NEW" (3 semaines)
});

module.exports = mongoose.model('Product', productSchema);