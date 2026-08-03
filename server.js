const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Order = require('./models/order');
const Product = require('./models/product');
const Promo = require('./models/promo');

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

// --- ROUTES COMMANDES ---
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// --- ROUTES PRODUITS (Catalogue géré par l'admin) ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Produit supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROUTES PROMOS (Gestion des promotions par l'admin) ---
app.get('/api/promos', async (req, res) => {
  try {
    const promos = await Promo.find();
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/promos', async (req, res) => {
  try {
    const newPromo = new Promo(req.body);
    const savedPromo = await newPromo.save();
    res.status(201).json(savedPromo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/promos/:id', async (req, res) => {
  try {
    await Promo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});