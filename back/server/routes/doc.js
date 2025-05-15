const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const PDFDocument = require("pdfkit");

const router = express.Router();

module.exports = (docWss) => {
  const FILE_PATH = "data/data.json";

  async function readDocData() {
    try {
      const data = await fs.readFile(FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
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

  async function writeDocData(data) {
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  }

  // Crear un nuevo documento
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

  // Obtener todos los documentos
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

  // Obtener documento específico
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

  // Actualizar documento
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

      doc.contenido = contenido;
      if (!doc.editores.includes(editorId)) doc.editores.push(editorId);
      await writeDocData(data);

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

  // Guardar documento (manual)
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

  // DESCARGAR documento en txt o pdf
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
        const fileName = `${doc.nombre || "documento"}.txt`;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
        res.setHeader("Content-Type", "text/plain");
        res.send(content);
      } else if (format === "pdf") {
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
        res
          .status(400)
          .json({ error: "Formato no soportado. Usa 'txt' o 'pdf'." });
      }
    } catch (error) {
      res
        .status(500)
        .json({
          error: "Error al descargar el documento",
          details: error.message,
        });
    }
  });

  // WebSocket
  docWss.on("connection", async (ws) => {
    console.log("Cliente conectado al documento colaborativo");

    const data = await readDocData();
    ws.send(JSON.stringify({ type: "initDocs", documents: data.documentos }));

    ws.on("message", async (message) => {
      const { type, docId, contenido, editorId } = JSON.parse(message);
      if (type === "update" && docId && contenido !== undefined && editorId) {
        const data = await readDocData();
        const doc = data.documentos.find((d) => d.id === docId);
        if (doc) {
          doc.contenido = contenido;
          if (!doc.editores.includes(editorId)) doc.editores.push(editorId);
          await writeDocData(data);
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
