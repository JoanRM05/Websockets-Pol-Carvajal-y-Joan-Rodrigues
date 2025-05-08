const express = require("express");
const router = express.Router();
const fs = require("fs");

router.post("/login", (req, res) => {
  const { gmail } = req.body;

  if (!gmail) {
    return res
      .status(400)
      .json({ success: false, message: 'Falta el camp "gmail"' });
  }

  if (!fs.existsSync("data/data.json")) {
    return res
      .status(500)
      .json({ success: false, message: "No es troba el fitxer d’usuaris" });
  }

  const data = JSON.parse(fs.readFileSync("data/data.json", "utf8"));

  const user = data.usuarios.find(
    (u) => u.email.toLowerCase() === gmail.toLowerCase()
  );

  if (user) {
    res.json({
      success: true,
      user: { id: user.id, nombre: user.nombre, email: user.email },
    });
  } else {
    res.status(404).json({ success: false, message: "Usuari no trobat" });
  }
});

module.exports = router;
