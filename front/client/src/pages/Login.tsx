import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/api";
import "./Login.css";

function Login() {
  const [gmail, setGmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(gmail);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err) {
      setError(
        "Error en iniciar sesión. Por favor, verifica tu correo electrónico."
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Inicio de Session</h1>
        <img src="stucomlogo.png" alt="imgstucom" style={{ width: "80%", marginBottom: "15px"}} />
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
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
