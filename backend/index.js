// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB connection ---
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// --- Schema ---
const playerSchema = new mongoose.Schema({
  name: { type: String, unique: true }, // prevent duplicates
  score: { type: Number, default: 0 },
});

const Player = mongoose.model("Player", playerSchema);

// --- Routes ---
// Create new player
app.post("/api/player", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    // check if exists
    const existing = await Player.findOne({ name });
    if (existing) return res.status(400).json({ error: "Name already taken" });

    const player = new Player({ name });
    await player.save();
    res.json({ message: "Player created", player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update score
app.post("/api/score", async (req, res) => {
  try {
    const { name, score } = req.body;
    if (!name || score == null) return res.status(400).json({ error: "Invalid input" });

    // update only if new score is higher
    const player = await Player.findOne({ name });
    if (!player) return res.status(404).json({ error: "Player not found" });

    if (score > player.score) {
      player.score = score;
      await player.save();
    }

    res.json({ message: "Score updated", player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Player.find().sort({ score: -1 });
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Server start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
