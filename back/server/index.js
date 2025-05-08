const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { WebSocketServer } = require("ws");

const app = express();

app.use(cors());
app.use(express.json());

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

// Crear el servidor WebSocket
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
const wss = new WebSocketServer({ server });

// Pasar wss a las rutas para que puedan usarlo
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const chatRoutes = require("./routes/chat")(wss); // Pasamos wss como argumento
app.use("/api/chat", chatRoutes);

wss.on("connection", (ws) => {
  console.log("Nuevo cliente conectado");
  ws.on("close", () => console.log("Cliente desconectado"));
  ws.on("error", (error) => console.error("Error en WebSocket:", error));
});
