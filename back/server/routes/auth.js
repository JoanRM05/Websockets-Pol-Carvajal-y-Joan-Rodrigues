/**
 * User Login Route Module
 * ------------------------------------------------------------
 * Esta ruta permite autenticar usuarios mediante su correo electrónico (gmail).
 * Se valida que el correo exista en el archivo JSON de usuarios.
 *
 * Endpoint expuesto:
 * - POST /login → Autenticar usuario por correo electrónico
 */

const express = require("express");
const router = express.Router();
const fs = require("fs");

/**
 * POST /login
 * Recibe un correo electrónico (gmail) y busca un usuario con ese correo.
 * Responde con los datos básicos del usuario si se encuentra.
 *
 * Request body:
 * - gmail: string (correo electrónico)
 *
 * Responses:
 * - 200: { success: true, user: { id, nombre, email } }
 * - 400: { success: false, message: 'Falta el camp "gmail"' }
 * - 404: { success: false, message: "Usuari no trobat" }
 * - 500: { success: false, message: "No es troba el fitxer d’usuaris" }
 */
router.post("/login", (req, res) => {
  const { gmail } = req.body;

  // Validación: el campo gmail es obligatorio
  if (!gmail) {
    return res
      .status(400)
      .json({ success: false, message: 'Falta el camp "gmail"' });
  }

  // Verificar existencia del archivo de datos
  if (!fs.existsSync("data/data.json")) {
    return res
      .status(500)
      .json({ success: false, message: "No es troba el fitxer d’usuaris" });
  }

  // Leer y parsear datos JSON
  const data = JSON.parse(fs.readFileSync("data/data.json", "utf8"));

  // Buscar usuario cuyo email coincida (sin distinguir mayúsculas/minúsculas)
  const user = data.usuarios.find(
    (u) => u.email.toLowerCase() === gmail.toLowerCase()
  );

  // Si el usuario existe, enviar datos básicos
  if (user) {
    res.json({
      success: true,
      user: { id: user.id, nombre: user.nombre, email: user.email },
    });
  } else {
    // Usuario no encontrado
    res.status(404).json({ success: false, message: "Usuari no trobat" });
  }
});

module.exports = router;
