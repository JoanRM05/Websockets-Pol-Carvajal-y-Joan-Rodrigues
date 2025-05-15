import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { User } from "../types";

// Define la interfaz de las propiedades que recibe el componente.
// `children` representa el contenido que se mostrará si el acceso está permitido.
interface ProtectedRouteProps {
  children: JSX.Element;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Intenta recuperar los datos del usuario desde el almacenamiento local del navegador.
  // Si no hay datos, se asume que el usuario no está autenticado.
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  // Si no se encuentra un usuario autenticado, redirige al inicio de sesión (ruta "/").
  // `replace` evita que la redirección se almacene en el historial de navegación.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Si el usuario está autenticado, se permite el acceso y se renderiza el contenido protegido.
  return children;
}

export default ProtectedRoute;
