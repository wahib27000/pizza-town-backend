const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Import des modèles
const Order = require('./models/order');
const Product = require('./models/product');
const Promo = require('./models/promo');
const User = require('./models/user');

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://wahibbertoune_db_user:cPQQUxaACjoT3J1s@pizzatowncluster.tapbmak.mongodb.net/pizzatown?appName=PizzaTownCluster';
const JWT_SECRET = process.env.JWT_SECRET || 'pizza_town_super_secret_key_2026';

mongoose.connect(MONGO_URI)
.then(() => console.log('Connecté à MongoDB Atlas'))
.catch(err => console.error('Erreur de connexion MongoDB :', err));

// Configuration Email (Nodemailer)
// Attention : Remplace par tes vrais identifiants ou utilise un service comme SendGrid/Brevo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ton.email.pizzeria@gmail.com', 
    pass: 'ton_mot_de_passe_application_google' 
  }
});

// ==========================================
// ROUTES AUTHENTIFICATION & CLIENTS
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nom, email, password, telephone, accepteNewsletter } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Cet email est déjà utilisé." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nom, email, password: hashedPassword, telephone, accepteNewsletter
    });

    await newUser.save();
    res.status(201).json({ message: "Compte créé avec succès !" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email ou mot de passe incorrect." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Email ou mot de passe incorrect." });

    const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // On renvoie les infos client SANS le mot de passe
    res.json({ 
      token, 
      user: { _id: user._id, nom: user.nom, email: user.email, telephone: user.telephone, adresse: user.adresse, ville: user.ville, accepteNewsletter: user.accepteNewsletter } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mot de passe oublié (Génération du token et envoi d'email)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "Aucun compte lié à cet email." });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    const resetUrl = `https://pizzatownlouvier.netlify.app/reset-password.html?token=${token}`;
    
    await transporter.sendMail({
      to: user.email,
      from: 'contact@pizzatown.fr',
      subject: 'Réinitialisation de votre mot de passe - Pizza Town',
      text: `Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur ce lien pour en créer un nouveau : \n\n ${resetUrl} \n\n Si vous n'avez rien demandé, ignorez cet email.`
    });

    res.json({ message: "Un email de réinitialisation vous a été envoyé." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer tous les clients pour l'Admin (sans les mots de passe)
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpires').sort({ dateCreation: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envoi de la Newsletter depuis l'Admin (Filtrage auto)
app.post('/api/admin/newsletter', async (req, res) => {
  try {
    const { sujet, message } = req.body;
    // On récupère UNIQUEMENT ceux qui ont dit OUI
    const subscribers = await User.find({ accepteNewsletter: true });
    
    if (subscribers.length === 0) return res.status(400).json({ message: "Aucun client abonné pour le moment." });

    const emails = subscribers.map(sub => sub.email);

    await transporter.sendMail({
      to: emails, // Envoi groupé (Attention aux limites Gmail en prod)
      from: 'newsletter@pizzatown.fr',
      subject: sujet,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #E63946;">Pizza Town</h1>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <br><br>
                <small style="color: #888;">Vous recevez cet email car vous êtes inscrit à notre programme de fidélité. Miam !</small>
             </div>`
    });

    res.json({ message: `Newsletter envoyée avec succès à ${emails.length} client(s) !` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ROUTES EXISTANTES (Commandes, Produits, Promos)
// ==========================================

// --- ROUTES COMMANDES ---
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    // Si l'utilisateur est connecté, on ajoute la commande à son historique
    if (req.body.userId) {
      await User.findByIdAndUpdate(req.body.userId, { $push: { historiqueCommandes: savedOrder._id } });
    }
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

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROUTES PRODUITS ---
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
app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROUTES PROMOS ---
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