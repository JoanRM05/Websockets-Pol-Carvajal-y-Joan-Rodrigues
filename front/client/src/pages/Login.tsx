import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/api";
import "./Login.css";

function Login() {
  // Estado para almacenar el correo electrónico ingresado por el usuario.
  const [gmail, setGmail] = useState<string>("");

  // Estado para mostrar mensajes de error en caso de fallo en el login.
  const [error, setError] = useState<string>("");

  // Hook de navegación proporcionado por React Router para redirigir al usuario.
  const navigate = useNavigate();

  // Función que se ejecuta al enviar el formulario de login.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario (recarga de la página).
    try {
      // Llama a la función `login` pasando el correo, y guarda el usuario en localStorage.
      const user = await login(gmail);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirige al usuario al panel principal tras iniciar sesión exitosamente.
      navigate("/dashboard");
    } catch (err) {
      // En caso de error (correo inválido, red o servidor), se muestra un mensaje al usuario.
      setError(
        "Error en iniciar sesión. Por favor, verifica tu correo electrónico."
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Inicio de Session</h1>

        {/* Logo de la aplicación (Stucom) */}
        <img
          src="stucomlogo.png"
          alt="imgstucom"
          style={{ width: "80%", marginBottom: "15px" }}
        />

        {/* Formulario de login con campo de texto y botón de envío */}
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Introduce tu gmail"
            className="login-input"
            value={gmail}
            onChange={(e) => setGmail(e.target.value)}
            required
          />
          <button type="submit" className="login-button">
            Acceder
          </button>
        </form>

        {/* Muestra el mensaje de error si existe */}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
