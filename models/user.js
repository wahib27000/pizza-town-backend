const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telephone: { type: String },
  adresse: { type: String },
  ville: { type: String },
  accepteNewsletter: { type: Boolean, default: false }, // Le client choisit ou non
  resetPasswordToken: { type: String }, // Pour le mdp oublié
  resetPasswordExpires: { type: Date },
  historiqueCommandes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);