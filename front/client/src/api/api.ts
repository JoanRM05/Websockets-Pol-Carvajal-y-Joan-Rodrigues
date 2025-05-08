import axios from "axios";

const API_URL = "http://localhost:4000/api";

export interface User {
  id: string;
  nombre: string;
  email: string;
}

export interface Message {
  id: string;
  salaId: string;
  emisorId: string;
  emisorName: string;
  contenido: string;
  timestamp: string;
}

// WebSocket para recibir mensajes
let ws: WebSocket | null = null;

export const connectWebSocket = (onMessage: (message: Message) => void) => {
  ws = new WebSocket("ws://localhost:4000");
  ws.onopen = () => console.log("Conexión WebSocket establecida");
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    onMessage(message);
  };
  ws.onerror = (error) => console.error("Error WebSocket:", error);
  ws.onclose = () => console.log("Conexión WebSocket cerrada");
};

export const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};

// Funciones REST
export const login = async (gmail: string): Promise<User> => {
  const response = await axios.post(`${API_URL}/auth/login`, { gmail });
  if (response.data.success) {
    return response.data.user;
  }
  throw new Error(response.data.message || "Error en iniciar sessió");
};

export const sendMessage = async (
  emisorId: string,
  contenido: string
): Promise<Message> => {
  const response = await axios.post(`${API_URL}/chat/send_message`, {
    emisorId,
    contenido,
  });
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.message || "Error en enviar el missatge");
};

export const getChatHistory = async (): Promise<Message[]> => {
  const response = await axios.get(`${API_URL}/chat/view_hist`);
  if (response.data.success) {
    return response.data.messages;
  }
  throw new Error(response.data.message || "Error en recuperar l’historial");
};
