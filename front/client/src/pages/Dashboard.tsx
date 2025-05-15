import { useNavigate } from "react-router-dom";
import Chat from "../components/Chat";
import CollaborativeDoc from "../components/CollaborativeDoc";
import SharedFiles from "../components/SharedFiles";
import { User } from "../types";
import "./Dashboard.css";

function Dashboard() {
  // Recupera los datos del usuario desde el almacenamiento local.
  // Si no hay datos, se interpreta que el usuario no está autenticado.
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  // Hook de navegación para redireccionar al usuario.
  const navigate = useNavigate();

  // Maneja el cierre de sesión eliminando el usuario del almacenamiento
  // y redirigiendo a la pantalla de inicio.
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // Si no hay un usuario cargado, no se renderiza nada.
  if (!user) return null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        {/* Logo institucional */}
        <div style={{ width: "10%" }}>
          <img src="stucomlogo.png" alt="imgstucom" style={{ width: "100%" }} />
        </div>

        {/* Saludo personalizado con el nombre del usuario */}
        <h1 className="dashboard-title">Bienvenid@, {user.nombre}!</h1>

        {/* Botón para cerrar sesión */}
        <button className="logout-button" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>

      {/* Cuerpo principal del dashboard que integra los módulos colaborativos */}
      <div className="dashboard-body">
        {/* Documento colaborativo en tiempo real */}
        <CollaborativeDoc user={user} />

        {/* Visualización y gestión de archivos compartidos */}
        <SharedFiles />

        {/* Chat en tiempo real */}
        <Chat user={user} />
      </div>
    </div>
  );
}

export default Dashboard;
