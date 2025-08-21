const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.post("/api/score", (req, res) => {
  // logic to save player score
  res.send({ status: "ok" });
});

app.get("/api/leaderboard", (req, res) => {
  // logic to fetch top scores
  res.send([]);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
