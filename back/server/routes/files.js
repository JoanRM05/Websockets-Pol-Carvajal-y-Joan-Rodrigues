/**
 * Rutas para manejo de archivos
 * ------------------------------------------------------------
 * Implementa la subida, listado y descarga de archivos usando Multer
 * con restricciones en tamaño y tipo de archivo.
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Directorio donde se guardan los archivos subidos
const UPLOAD_DIR = path.join(__dirname, "../uploads");

// Crear carpeta de uploads si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de Multer para almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR), // Carpeta destino
  filename: (req, file, cb) => {
    // Generar nombre único para evitar colisiones
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

// Configuración de multer con límites y filtro de tipos MIME permitidos
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Tamaño máximo 5MB
  fileFilter: (req, file, cb) => {
    // Tipos MIME permitidos
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Archivo permitido
    } else {
      cb(new Error("Tipo de archivo no permitido")); // Rechazar archivo
    }
  },
});

/**
 * ENVIAR_DOC - Subir archivo
 * POST /upload
 * Recibe un archivo en el campo "file" y lo almacena en el servidor.
 */
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Archivo requerido" });
  }
  res.status(200).json({
    message: "Archivo subido",
    filename: req.file.filename, // Nombre con el que se guardó el archivo
  });
});

/**
 * LIST_DOC - Listar archivos
 * GET /list
 * Devuelve la lista de nombres de archivos almacenados en uploads.
 */
router.get("/list", (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Error al leer archivos" });
    }
    res.status(200).json({ files });
  });
});

/**
 * DOWN_DOC - Descargar archivo
 * GET /download/:filename
 * Envía el archivo solicitado para descarga si existe en el servidor.
 */
router.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Verificar existencia del archivo
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "Archivo no encontrado" });
  }

  // Enviar archivo para descarga
  res.download(filepath, filename, (err) => {
    if (err) {
      console.error("Error en la descarga:", err);
    }
  });
});

module.exports = router;
