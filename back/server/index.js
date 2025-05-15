/**
 * Servidor Principal de la Aplicación
 * ------------------------------------------------------------
 * Configura el servidor Express, los WebSocket servers para chat
 * y documentos colaborativos, y registra las rutas API.
 */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { WebSocketServer } = require("ws");
const path = require("path");

const app = express();

// Middleware para permitir peticiones CORS y parsear JSON
app.use(cors());
app.use(express.json());

// Crear carpeta 'data' si no existe para almacenar datos persistentes
if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

// Configurar y arrancar servidor HTTP
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Configuración WebSocket para chat
const chatWss = new WebSocketServer({ noServer: true });

chatWss.on("connection", (ws) => {
  console.log("Nuevo cliente conectado al chat");

  // Manejo de desconexión del cliente de chat
  ws.on("close", () => console.log("Cliente desconectado del chat"));

  // Manejo de errores en WebSocket chat
  ws.on("error", (error) =>
    console.error("Error en WebSocket del chat:", error)
  );
});

// Configuración WebSocket para documento colaborativo
const docWss = new WebSocketServer({ noServer: true });

docWss.on("connection", (ws) => {
  console.log("Nuevo cliente conectado al documento colaborativo");

  // Manejo de desconexión del cliente del documento
  ws.on("close", () => console.log("Cliente desconectado del documento"));

  // Manejo de errores en WebSocket documento colaborativo
  ws.on("error", (error) =>
    console.error("Error en WebSocket del documento:", error)
  );
});

// Importar y usar rutas API
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const chatRoutes = require("./routes/chat")(chatWss);
app.use("/api/chat", chatRoutes);

const docRoutes = require("./routes/doc")(docWss);
app.use("/api/doc", docRoutes);

const fileRoutes = require("./routes/files");
app.use("/api/files", fileRoutes);

// Servir estáticamente la carpeta de archivos subidos (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Manejo de upgrade para conexiones WebSocket según la ruta
server.on("upgrade", (request, socket, head) => {
  // Obtener ruta del request para decidir a qué WebSocket asociar
  const pathname = new URL(request.url, `http://${request.headers.host}`)
    .pathname;

  if (pathname === "/") {
    // Upgrade para WebSocket de chat
    chatWss.handleUpgrade(request, socket, head, (ws) => {
      chatWss.emit("connection", ws, request);
    });
  } else if (pathname === "/doc") {
    // Upgrade para WebSocket de documento colaborativo
    docWss.handleUpgrade(request, socket, head, (ws) => {
      docWss.emit("connection", ws, request);
    });
  } else {
    // Destruir socket para rutas no soportadas
    socket.destroy();
  }
});
