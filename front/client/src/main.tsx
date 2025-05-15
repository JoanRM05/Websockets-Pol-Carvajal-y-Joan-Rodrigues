import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Renderiza el componente principal de la aplicación dentro del contenedor HTML con ID "root".
// Se utiliza la API moderna `createRoot` introducida en React 18 para habilitar características como el concurrent mode.
createRoot(document.getElementById("root")!).render(
  // `StrictMode` es un componente que activa verificaciones adicionales y advertencias
  // útiles durante el desarrollo, sin afectar el comportamiento en producción.
  <StrictMode>
    <App />
  </StrictMode>
);
