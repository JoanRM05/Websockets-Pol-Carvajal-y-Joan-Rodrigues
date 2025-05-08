const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());

app.use(express.json());

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const chatRoutes = require("./routes/chat");
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
);