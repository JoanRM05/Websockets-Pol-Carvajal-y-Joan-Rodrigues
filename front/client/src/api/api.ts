import axios from "axios";

const API_URL = "http://localhost:4000/api";

// Interfaces existentes
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

export interface Document {
  id: string;
  nombre: string;
  contenido: string;
  editores: string[];
}

// WebSocket para chat
let chatWs: WebSocket | null = null;

// Conectar WebSocket para chat
export const connectChatWebSocket = (onMessage: (message: Message) => void) => {
  chatWs = new WebSocket("ws://localhost:4000");
  chatWs.onopen = () => console.log("Conexión WebSocket para chat establecida");
  chatWs.onmessage = (event) => {
    const message = JSON.parse(event.data);
    onMessage(message);
  };
  chatWs.onerror = (error) =>
    console.error("Error WebSocket para chat:", error);
  chatWs.onclose = () => console.log("Conexión WebSocket para chat cerrada");
};

// Desconectar WebSocket para chat
export const disconnectChatWebSocket = () => {
  if (chatWs) {
    chatWs.close();
    chatWs = null;
  }
};

// Conectar WebSocket para documentos
export const connectDocWebSocket = (
  onMessage: (data: any) => void
): WebSocket => {
  const ws = new WebSocket("ws://localhost:4000/doc");
  ws.onopen = () =>
    console.log("Conexión WebSocket para documentos establecida");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  ws.onerror = (error) =>
    console.error("Error WebSocket para documentos:", error);
  ws.onclose = () => console.log("Conexión WebSocket para documentos cerrada");
  return ws;
};

// Desconectar WebSocket para documentos
export const disconnectDocWebSocket = (ws: WebSocket | null) => {
  if (ws) {
    ws.close();
  }
};

// Funciones REST existentes
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

export const downloadChatHistory = async (
  format: "txt" | "json" = "txt"
): Promise<void> => {
  try {
    const response = await axios.get(
      `${API_URL}/chat/view_hist?format=${format}`,
      {
        responseType: "blob",
      }
    );
    const blob = new Blob([response.data], {
      type: response.headers["content-type"],
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_history.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Error al descargar el chat"
    );
  }
};

// Funciones REST para documentos
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const response = await axios.get(`${API_URL}/doc/list`);
    return response.data.documents;
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    throw error;
  }
};

export const createDocument = async (nombre: string): Promise<Document> => {
  try {
    const response = await axios.post(`${API_URL}/doc/create`, { nombre });
    return response.data.document;
  } catch (error) {
    console.error("Error al crear documento:", error);
    throw error;
  }
};

export const getDocument = async (id: string): Promise<Document> => {
  try {
    const response = await axios.get(`${API_URL}/doc/get/${id}`);
    return response.data.document;
  } catch (error) {
    console.error("Error al obtener el documento:", error);
    throw error;
  }
};

export const saveDocument = async (docId: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/doc/save_doc`, { docId });
  } catch (error) {
    console.error("Error al guardar el documento:", error);
    throw error;
  }
};

export const downloadDocument = async (
  id: string,
  format: "txt" | "pdf",
  nombre: string
) => {
  const response = await axios.get(
    `${API_URL}/doc/download/${id}?format=${format}`,
    {
      responseType: "blob",
    }
  );

  const blob = new Blob([response.data], {
    type: format === "pdf" ? "application/pdf" : "text/plain",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nombre}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
