/**
 * Chat Routes Module
 * ------------------------------------------------------------
 * Este módulo define las rutas para la funcionalidad de chat en tiempo real,
 * incluyendo el envío de mensajes y la visualización/descarga del historial.
 * Utiliza un archivo JSON como almacenamiento persistente.
 *
 * Endpoints expuestos:
 * - POST /send_message  → Enviar un nuevo mensaje
 * - POST /save_hist     → Guardar historial actual
 * - GET  /view_hist     → Descargar historial en formato JSON o TXT
 *
 * Requiere un servidor WebSocket (wss) como argumento al inicializar.
 */

const express = require("express");
const fs = require("fs").promises;
const router = express.Router();

module.exports = (wss) => {
  const FILE_PATH = "data/data.json";

  // ------------------------------------------------------------
  // Funciones utilitarias de lectura/escritura
  // ------------------------------------------------------------

  // Lee los datos del archivo JSON (chat, usuarios, salas, mensajes)
  async function readChatData() {
    try {
      const data = await fs.readFile(FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      // Si el archivo no existe, se crea con datos por defecto
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
            id: "m1",
            salaId: "s1",
            emisorId: "u2",
            emisorName: "Ana",
            contenido: "Hola compañeros, ¿cómo están?",
            timestamp: "2025-04-20T10:05:00Z",
          },
          {
            id: "m2",
            salaId: "s1",
            emisorId: "u2",
            emisorName: "Ana",
            contenido: "Hola a todos, ¿trabajamos en el ejercicio juntos?",
            timestamp: "2025-04-20T10:10:00Z",
          },
          {
            id: "m3",
            salaId: "s1",
            emisorId: "u3",
            emisorName: "Luis",
            contenido: "Sí, perfecto. Empiezo con el login.",
            timestamp: "2025-04-20T10:12:00Z",
          },
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

  // Escribe los datos actualizados en el archivo JSON
  async function writeChatData(data) {
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  }

  // ------------------------------------------------------------
  // Funciones auxiliares de formato de fecha y hora
  // ------------------------------------------------------------

  // Formatea un Date a una cadena ISO (UTC)
  function formatTimestamp(date) {
    return date.toISOString();
  }

  // Formato: "--- dd de Mes del aaaa ---"
  function formatDateHeader(date) {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return `--- ${date.getDate()} de ${
      months[date.getMonth()]
    } de ${date.getFullYear()} ---`;
  }

  // Formato: "hh:mm:ss" (hora local española, 24h)
  function formatTime(date) {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  // ------------------------------------------------------------
  // POST /send_message → Enviar mensaje a la sala general
  // ------------------------------------------------------------
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

      // Validar existencia del usuario emisor
      const userExists = data.usuarios.some((user) => user.id === emisorId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "Usuari no trobat",
        });
      }

      // Crear y guardar mensaje
      const message = {
        id: `m${Date.now()}`,
        salaId: "s1",
        emisorId,
        emisorName:
          data.usuarios.find((u) => u.id === emisorId)?.nombre || emisorId,
        contenido,
        timestamp: formatTimestamp(new Date()),
      };

      data.mensajes.push(message);
      await writeChatData(data);

      // Emitir mensaje a todos los clientes WebSocket conectados
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
      return res.status(500).json({
        success: false,
        message: "Error en enviar el missatge",
        error,
      });
    }
  });

  // ------------------------------------------------------------
  // POST /save_hist → (Inútil, pero mantenido por compatibilidad)
  // ------------------------------------------------------------
  router.post("/save_hist", async (req, res) => {
    try {
      const data = await readChatData();
      await writeChatData(data);
      return res.status(200).json({
        success: true,
        message: "Historial guardat amb èxit",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error en guardar l’historial",
        error,
      });
    }
  });

  // ------------------------------------------------------------
  // GET /view_hist → Ver o descargar historial (json o txt)
  // ------------------------------------------------------------
  router.get("/view_hist", async (req, res) => {
    const { format } = req.query;

    try {
      const data = await readChatData();
      const messages = data.mensajes;

      if (format === "txt") {
        // Agrupar mensajes por fecha
        const messagesByDate = {};
        messages.forEach((msg) => {
          const dateKey = new Date(msg.timestamp).toISOString().split("T")[0];
          if (!messagesByDate[dateKey]) {
            messagesByDate[dateKey] = [];
          }
          messagesByDate[dateKey].push(msg);
        });

        // Construir contenido de texto
        let textContent = "";
        for (const dateKey in messagesByDate) {
          const date = new Date(dateKey);
          textContent += `${formatDateHeader(date)}\n`;
          messagesByDate[dateKey].forEach((msg) => {
            const time = formatTime(new Date(msg.timestamp));
            textContent += `${msg.emisorName} (${time}): ${msg.contenido}\n`;
          });
          textContent += "\n";
        }

        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="chat_history.txt"'
        );
        return res.status(200).send(textContent.trim());
      }

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="chat_history.json"'
        );
        return res.status(200).send(JSON.stringify({ messages }, null, 2));
      }

      // Sin parámetro de formato → respuesta JSON estándar
      return res.status(200).json({ success: true, messages });
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
