const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config(); // for your DB_URI in .env

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve your HTML/CSS/JS

// --- MongoDB setup ---
const uri = process.env.DB_URI; // put your MongoDB URI in .env
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

let leaderboardCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("flappybird");
    leaderboardCollection = db.collection("scores");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectDB();

// --- API routes ---

// check if name is taken
app.get("/api/check-name", async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: "Name required" });

  const exists = await leaderboardCollection.findOne({ name });
  res.json({ taken: !!exists });
});

// submit score
app.post("/api/submit-score", async (req, res) => {
  const { name, score } = req.body;
  if (!name || score == null)
    return res.status(400).json({ error: "Name and score required" });

  // insert or update score if higher
  const existing = await leaderboardCollection.findOne({ name });
  if (!existing || score > existing.score) {
    await leaderboardCollection.updateOne(
      { name },
      { $set: { score } },
      { upsert: true }
    );
  }
  res.json({ success: true });
});

// get top 10 scores
app.get("/api/leaderboard", async (req, res) => {
  const topScores = await leaderboardCollection
    .find({})
    .sort({ score: -1 })
    .limit(10)
    .toArray();
  res.json(topScores);
});

// --- start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
