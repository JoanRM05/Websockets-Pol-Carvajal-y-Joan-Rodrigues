import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function App() {
  return (
    // Define el enrutador principal de la aplicación utilizando `BrowserRouter` (alias `Router`),
    // que gestiona la navegación mediante la API de historial del navegador.
    <Router>
      <Routes>
        {/* Ruta pública: muestra el componente de inicio de sesión al acceder a la raíz "/" */}
        <Route path="/" element={<Login />} />

        {/* Ruta protegida: solo accesible si el usuario cumple ciertas condiciones (por ejemplo, estar autenticado).
            El componente `ProtectedRoute` actúa como un wrapper que controla el acceso antes de mostrar el contenido */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
