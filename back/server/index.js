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

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// WebSocket para chat
const chatWss = new WebSocketServer({ noServer: true });
chatWss.on("connection", (ws) => {
  console.log("Nuevo cliente conectado al chat");
  ws.on("close", () => console.log("Cliente desconectado del chat"));
  ws.on("error", (error) =>
    console.error("Error en WebSocket del chat:", error)
  );
});

// WebSocket para documento colaborativo
const docWss = new WebSocketServer({ noServer: true });
docWss.on("connection", (ws) => {
  console.log("Nuevo cliente conectado al documento colaborativo");
  ws.on("close", () => console.log("Cliente desconectado del documento"));
  ws.on("error", (error) =>
    console.error("Error en WebSocket del documento:", error)
  );
});

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const chatRoutes = require("./routes/chat")(chatWss);
app.use("/api/chat", chatRoutes);

// Nueva ruta para el documento colaborativo
const docRoutes = require("./routes/doc")(docWss);
app.use("/api/doc", docRoutes);

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`)
    .pathname;

  if (pathname === "/") {
    chatWss.handleUpgrade(request, socket, head, (ws) => {
      chatWss.emit("connection", ws, request);
    });
  } else if (pathname === "/doc") {
    docWss.handleUpgrade(request, socket, head, (ws) => {
      docWss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});
