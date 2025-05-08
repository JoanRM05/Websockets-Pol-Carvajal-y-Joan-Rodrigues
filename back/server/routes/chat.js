const express = require("express");
const fs = require("fs").promises;
const router = express.Router();

module.exports = (wss) => {
  const FILE_PATH = "data/data.json";

  async function readChatData() {
    try {
      const data = await fs.readFile(FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      const defaultData = {
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
      await fs.writeFile(
        FILE_PATH,
        JSON.stringify(defaultData, null, 2),
        "utf-8"
      );
      return defaultData;
    }
  }

  async function writeChatData(data) {
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  }

  // Endpoint: Enviar i rebre missatges (SEND_MESSAGE)
  router.post("/send_message", async (req, res) => {
    const { emisorId, contenido } = req.body;

    if (!emisorId || !contenido) {
      return res.status(400).json({
        success: false,
        message: "emisorId i contenido són obligatoris",
      });
    }

    try {
      const data = await readChatData();
      const userExists = data.usuarios.some((user) => user.id === emisorId);
      if (!userExists) {
        return res
          .status(404)
          .json({ success: false, message: "Usuari no trobat" });
      }
      const user = data.usuarios.find((user) => user.id === emisorId);
      const name = user.nombre;
      const message = {
        id: `m${Date.now()}`,
        salaId: "s1",
        emisorId,
        emisorName: name,
        contenido,
        timestamp: new Date().toISOString(),
      };
      data.mensajes.push(message);
      await writeChatData(data);

      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send(JSON.stringify(message));
        }
      });

      return res.status(200).json({
        success: true,
        message: "Missatge enviat amb èxit",
        data: message,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error en enviar el missatge",
        error,
      });
    }
  });

  // Mantener SAVE_HIST y VIEW_HIST sin cambios
  router.post("/save_hist", async (req, res) => {
    try {
      const data = await readChatData();
      await writeChatData(data);
      return res
        .status(200)
        .json({ success: true, message: "Historial guardat amb èxit" });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error en guardar l’historial",
        error,
      });
    }
  });

  router.get("/view_hist", async (req, res) => {
    const { format } = req.query;

    try {
      const data = await readChatData();
      const messages = data.mensajes.filter((msg) => msg.salaId === "s1");

      if (format === "txt") {
        const textContent = messages
          .map((msg) => {
            const user = data.usuarios.find((u) => u.id === msg.emisorId);
            const senderName = user ? user.nombre : msg.emisorId;
            return `[${msg.timestamp}] ${senderName}: ${msg.contenido}`;
          })
          .join("\n");
        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="chat_history.txt"'
        );
        return res.status(200).send(textContent);
      } else {
        res.setHeader("Content-Type", "application/json");
        if (format === "json") {
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="chat_history.json"'
          );
        }
        return res.status(200).json({ success: true, messages });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error en recuperar l’historial",
        error,
      });
    }
  });

  return router;
};
