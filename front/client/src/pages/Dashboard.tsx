import { useNavigate } from "react-router-dom";
import Chat from "../components/Chat";
import { User } from "../types";
import "./Dashboard.css";

function Dashboard() {
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div style={{ width: "10%" }}>
          <img src="stucomlogo.png" alt="imgstucom" style={{ width: "100%" }} />
        </div>
        <h1 className="dashboard-title">Bienvenid@, {user.nombre}!</h1>
        <button className="logout-button" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
      <div className="dashboard-body">
        <div></div>
        <Chat user={user} />
      </div>
      
    </div>
  );
}

export default Dashboard;
