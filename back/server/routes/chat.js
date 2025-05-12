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
        mensajes: [
          {
            "id": "m1",
            "salaId": "s1",
            "emisorId": "u2",
            "emisorName": "Ana",
            "contenido": "Hola compañeros, ¿cómo están?",
            "timestamp": "2025-04-20T10:05:00Z"
          },
          {
            "id": "m2",
            "salaId": "s1",
            "emisorId": "u2",
            "emisorName": "Ana",
            "contenido": "Hola a todos, ¿trabajamos en el ejercicio juntos?",
            "timestamp": "2025-04-20T10:10:00Z"
          },
          {
            "id": "m3",
            "salaId": "s1",
            "emisorId": "u3",
            "emisorName": "Luis",
            "contenido": "Sí, perfecto. Empiezo con el login.",
            "timestamp": "2025-04-20T10:12:00Z"
          }
        ],
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

  // Función para formatear la fecha en UTC
  function formatTimestamp(date) {
    return date.toISOString(); 
  }

  // Función para formatear la fecha al estilo "--- dd de Mes del aaaa ---"
  function formatDateHeader(date) {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `--- ${day} de ${month} de ${year} ---`;
  }

  // Función para formatear la hora al estilo "hh:mm:ss"
  function formatTime(date) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
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
      const message = {
        id: `m${Date.now()}`,
        salaId: "s1",
        emisorId,
        emisorName: data.usuarios.find((u) => u.id === emisorId)?.nombre || emisorId,
        contenido,
        timestamp: formatTimestamp(new Date()),
      };
      data.mensajes.push(message);
      await writeChatData(data);

      // Enviar el mensaje a todos los clientes conectados a través de WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(message));
        }
      });

      return res.status(200).json({
        success: true,
        message: "Missatge enviat amb èxit",
        data: message,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Error en enviar el missatge",
          error,
        });
    }
  });

  // SAVE_HIST
  router.post("/save_hist", async (req, res) => {
    try {
      const data = await readChatData();
      await writeChatData(data);
      return res
        .status(200)
        .json({ success: true, message: "Historial guardat amb èxit" });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Error en guardar l’historial",
          error,
        });
    }
  });

  // VIEW_HIST 
  router.get("/view_hist", async (req, res) => {
    const { format } = req.query;

    try {
      const data = await readChatData();
      const messages = data.mensajes; // Incluir todos los mensajes sin filtro por fecha

      if (format === "txt") {
        // Agrupar mensajes por fecha
        const messagesByDate = {};
        messages.forEach((msg) => {
          const msgDate = new Date(msg.timestamp);
          const dateKey = msgDate.toISOString().split('T')[0];
          if (!messagesByDate[dateKey]) {
            messagesByDate[dateKey] = [];
          }
          messagesByDate[dateKey].push(msg);
        });

        // Construir el contenido del archivo
        let textContent = '';
        for (const dateKey in messagesByDate) {
          const date = new Date(dateKey);
          textContent += `${formatDateHeader(date)}\n`;
          messagesByDate[dateKey].forEach((msg) => {
            const msgDate = new Date(msg.timestamp);
            const time = formatTime(msgDate);
            textContent += `${msg.emisorName} (${time}): ${msg.contenido}\n`;
          });
          textContent += '\n';
        }

        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="chat_history.txt"'
        );
        return res.status(200).send(textContent.trim()); 
      } else {
        
        res.setHeader("Content-Type", "application/json");
        if (format === "json") {
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="chat_history.json"'
          );
          const prettyJson = JSON.stringify({ messages }, null, 2);
          return res.status(200).send(prettyJson);
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