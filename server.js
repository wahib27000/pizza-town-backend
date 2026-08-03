const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Order = require('./models/order');

const app = express();
app.use(express.json());
app.use(cors());

// Connexion MongoDB Atlas
mongoose.connect('mongodb+srv://wahib27000:TON_MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/pizzatown?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB Atlas'))
.catch(err => console.error('Erreur de connexion MongoDB :', err));

// Route pour créer une commande (utilisée par le site client)
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route pour récupérer toutes les commandes (utilisée par l'admin)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }); // Plus récentes en premier
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route pour mettre à jour le statut d'une commande
app.put('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});