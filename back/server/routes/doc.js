/**
 * Documentos Colaborativos Routes Module
 * ------------------------------------------------------------
 * Este módulo define las rutas para la gestión de documentos colaborativos,
 * permitiendo crear, listar, obtener, actualizar, guardar y descargar documentos.
 * Utiliza un archivo JSON como almacenamiento persistente.
 * Incluye también la integración con WebSocket para actualizaciones en tiempo real.
 *
 * Endpoints expuestos:
 * - POST   /create           → Crear un nuevo documento
 * - GET    /list             → Obtener lista de documentos
 * - GET    /get/:id          → Obtener un documento específico
 * - POST   /update/:id       → Actualizar contenido y editores del documento
 * - POST   /save_doc         → Guardar documento manualmente
 * - GET    /download/:id     → Descargar documento en formato TXT o PDF
 *
 * Requiere un servidor WebSocket (docWss) como argumento al inicializar.
 */

const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const PDFDocument = require("pdfkit");

const router = express.Router();

module.exports = (docWss) => {
  const FILE_PATH = "data/data.json";

  // ------------------------------------------------------------
  // Funciones utilitarias de lectura/escritura
  // ------------------------------------------------------------

  /**
   * Lee los datos de documentos desde el archivo JSON.
   * Si el archivo no existe, crea uno con datos por defecto.
   * @returns {Promise<Object>} Datos leídos del archivo JSON.
   */
  async function readDocData() {
    try {
      const data = await fs.readFile(FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      // Datos iniciales por defecto en caso de archivo inexistente
      const defaultData = {
        usuarios: [],
        salas: [],
        mensajes: [],
        documentos: [
          { id: "d1", nombre: "Documento 1", contenido: "", editores: [] },
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

  /**
   * Escribe los datos de documentos en el archivo JSON.
   * @param {Object} data - Datos a guardar.
   * @returns {Promise<void>}
   */
  async function writeDocData(data) {
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  }

  // ------------------------------------------------------------
  // POST /create → Crear un nuevo documento
  // ------------------------------------------------------------
  router.post("/create", async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: "El nombre del documento es obligatorio",
      });
    }

    try {
      const data = await readDocData();
      const newDoc = {
        id: `d${Date.now()}`,
        nombre,
        contenido: "",
        editores: [],
      };
      data.documentos.push(newDoc);
      await writeDocData(data);

      // Notificar a todos los clientes WebSocket sobre el nuevo documento
      docWss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: "newDoc", document: newDoc }));
        }
      });

      res.json({ success: true, document: newDoc });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear el documento",
        error,
      });
    }
  });

  // ------------------------------------------------------------
  // GET /list → Obtener todos los documentos
  // ------------------------------------------------------------
  router.get("/list", async (req, res) => {
    try {
      const data = await readDocData();
      res.json({ success: true, documents: data.documentos });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener los documentos",
        error,
      });
    }
  });

  // ------------------------------------------------------------
  // GET /get/:id → Obtener un documento específico por ID
  // ------------------------------------------------------------
  router.get("/get/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const data = await readDocData();
      const doc = data.documentos.find((d) => d.id === id);
      if (!doc) {
        return res
          .status(404)
          .json({ success: false, message: "Documento no encontrado" });
      }
      res.json({ success: true, document: doc });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener el documento",
        error,
      });
    }
  });

  // ------------------------------------------------------------
  // POST /update/:id → Actualizar contenido y editores del documento
  // ------------------------------------------------------------
  router.post("/update/:id", async (req, res) => {
    const { id } = req.params;
    const { contenido, editorId } = req.body;

    if (contenido === undefined || !editorId) {
      return res.status(400).json({
        success: false,
        message: "contenido y editorId son obligatorios",
      });
    }

    try {
      const data = await readDocData();
      const doc = data.documentos.find((d) => d.id === id);
      if (!doc) {
        return res
          .status(404)
          .json({ success: false, message: "Documento no encontrado" });
      }

      // Actualizar contenido y lista de editores
      doc.contenido = contenido;
      if (!doc.editores.includes(editorId)) doc.editores.push(editorId);
      await writeDocData(data);

      // Notificar a todos los clientes WebSocket sobre la actualización
      docWss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({ type: "update", docId: id, contenido, editorId })
          );
        }
      });

      res.json({
        success: true,
        message: "Documento actualizado",
        document: doc,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar el documento",
        error,
      });
    }
  });

  // ------------------------------------------------------------
  // POST /save_doc → Guardar documento manualmente
  // ------------------------------------------------------------
  router.post("/save_doc", async (req, res) => {
    const { docId } = req.body;
    if (!docId) {
      return res
        .status(400)
        .json({ success: false, message: "docId es obligatorio" });
    }
    try {
      const data = await readDocData();
      const doc = data.documentos.find((d) => d.id === docId);
      if (!doc) {
        return res
          .status(404)
          .json({ success: false, message: "Documento no encontrado" });
      }
      // Guardar datos en archivo
      await writeDocData(data);
      res.json({ success: true, message: "Documento guardado con éxito" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al guardar el documento",
        error,
      });
    }
  });

  // ------------------------------------------------------------
  // GET /download/:id → Descargar documento en formato TXT o PDF
  // ------------------------------------------------------------
  router.get("/download/:id", async (req, res) => {
    const format = req.query.format; // 'txt' o 'pdf'
    const { id } = req.params;

    try {
      const data = await readDocData();
      const doc = data.documentos.find((d) => d.id === id);

      if (!doc) {
        return res.status(404).json({ error: "Documento no encontrado" });
      }

      const content = doc.contenido || "";

      if (format === "txt") {
        // Descargar como archivo de texto plano
        const fileName = `${doc.nombre || "documento"}.txt`;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
        res.setHeader("Content-Type", "text/plain");
        res.send(content);
      } else if (format === "pdf") {
        // Descargar como archivo PDF generado dinámicamente
        const fileName = `${doc.nombre || "documento"}.pdf`;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
        res.setHeader("Content-Type", "application/pdf");

        const pdfDoc = new PDFDocument();
        pdfDoc.pipe(res);
        pdfDoc.text(content);
        pdfDoc.end();
      } else {
        // Formato no soportado
        res
          .status(400)
          .json({ error: "Formato no soportado. Usa 'txt' o 'pdf'." });
      }
    } catch (error) {
      res.status(500).json({
        error: "Error al descargar el documento",
        details: error.message,
      });
    }
  });

  // ------------------------------------------------------------
  // WebSocket - Gestión de conexión y mensajes en tiempo real
  // ------------------------------------------------------------
  docWss.on("connection", async (ws) => {
    console.log("Cliente conectado al documento colaborativo");

    // Enviar estado inicial con todos los documentos disponibles
    const data = await readDocData();
    ws.send(JSON.stringify({ type: "initDocs", documents: data.documentos }));

    // Manejo de mensajes entrantes vía WebSocket
    ws.on("message", async (message) => {
      const { type, docId, contenido, editorId } = JSON.parse(message);

      if (type === "update" && docId && contenido !== undefined && editorId) {
        const data = await readDocData();
        const doc = data.documentos.find((d) => d.id === docId);
        if (doc) {
          doc.contenido = contenido;
          if (!doc.editores.includes(editorId)) doc.editores.push(editorId);
          await writeDocData(data);

          // Difundir actualización a todos los clientes excepto al que envió
          docWss.clients.forEach((client) => {
            if (client.readyState === 1 && client !== ws) {
              client.send(
                JSON.stringify({ type: "update", docId, contenido, editorId })
              );
            }
          });
        }
      }

      if (type === "requestDoc" && docId) {
        // Cliente solicita contenido completo de un documento específico
        const data = await readDocData();
        const doc = data.documentos.find((d) => d.id === docId);
        if (doc) {
          ws.send(
            JSON.stringify({
              type: "initDoc",
              docId: doc.id,
              contenido: doc.contenido,
            })
          );
        }
      }
    });

    ws.on("close", () => console.log("Cliente desconectado del documento"));
  });

  return router;
};
