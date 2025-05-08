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

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const chatRoutes = require("./routes/chat");
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () =>
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
);

// Configurar WebSocket
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Nuevo cliente conectado");

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    const { emisorId, contenido } = data;

    if (!emisorId || !contenido) {
      ws.send(
        JSON.stringify({
          success: false,
          message: "emisorId y contenido son obligatorios",
        })
      );
      return;
    }

    // Leer datos actuales
    const filePath = "data/data.json";
    let dataStore = {};
    if (fs.existsSync(filePath)) {
      dataStore = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
      dataStore = {
        usuarios: [],
        salas: [
          {
            id: "s1",
            nombre: "Sala General",
            tipo: "publica",
            participantes: [],
          },
        ],
        mensajes: [],
      };
      fs.writeFileSync(filePath, JSON.stringify(dataStore, null, 2), "utf-8");
    }

    // Verificar si el usuario existe
    const userExists = dataStore.usuarios.some((user) => user.id === emisorId);
    if (!userExists) {
      ws.send(JSON.stringify({ success: false, message: "Usuari no trobat" }));
      return;
    }

    // Crear y guardar nuevo mensaje
    const messageObj = {
      id: `m${Date.now()}`,
      salaId: "s1",
      emisorId,
      contenido,
      timestamp: new Date().toISOString(),
    };
    dataStore.mensajes.push(messageObj);
    fs.writeFileSync(filePath, JSON.stringify(dataStore, null, 2), "utf-8");

    // Enviar el mensaje a todos los clientes conectados
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(messageObj));
      }
    });
  });

  ws.on("close", () => {
    console.log("Cliente desconectado");
  });

  ws.on("error", (error) => {
    console.error("Error en WebSocket:", error);
  });
});
