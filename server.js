const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = "mongodb+srv://wahibbertoune_db_user:cPQQUxaACjoT3J1s@pizzatowncluster.tapbmak.mongodb.net/?appName=PizzaTownCluster";

mongoose.connect(MONGO_URI)
.then(() => console.log("✅ Connecté avec succès à MongoDB Atlas !"))
.catch(err => console.error("❌ Erreur de connexion à MongoDB :", err));

app.get('/', (req, res) => {
    res.send("API Pizza Town en marche 🚀");
});

const Order = require('./models/order');

// Enregistrer une commande
app.post('/api/orders', async (req, res) => {
    try {
        const nouvelleCommande = new Order(req.body);
        await nouvelleCommande.save(); 
        console.log("🍕 Nouvelle commande reçue et enregistrée !");
        res.status(201).json({ success: true, orderId: nouvelleCommande._id, message: "Commande enregistrée !" });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement :", error);
        res.status(500).json({ success: false, error: "Erreur serveur." });
    }
});

// Récupérer toutes les commandes
app.get('/api/orders', async (req, res) => {
    try {
        const commandes = await Order.find().sort({ date: -1 });
        res.json(commandes);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des commandes." });
    }
});

// Récupérer une commande par son ID (pour le tracker client)
app.get('/api/orders/:id', async (req, res) => {
    try {
        const commande = await Order.findById(req.params.id);
        if (!commande) return res.status(404).json({ error: "Commande introuvable" });
        res.json(commande);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Mettre à jour le statut d'une commande (Admin)
app.patch('/api/orders/:id/statut', async (req, res) => {
    try {
        const { statut } = req.body;
        const commandeMiseAJour = await Order.findByIdAndUpdate(
            req.params.id, 
            { statut: statut }, 
            { new: true }
        );
        if (!commandeMiseAJour) return res.status(404).json({ success: false, error: "Introuvable" });
        
        console.log(`🔄 Commande ${req.params.id} passée en statut : ${statut}`);
        res.json({ success: true, commande: commandeMiseAJour });
    } catch (error) {
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});