import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { User } from "../types";

interface ProtectedRouteProps {
  children: JSX.Element;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
