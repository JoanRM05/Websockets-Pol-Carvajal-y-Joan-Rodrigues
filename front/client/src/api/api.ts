import axios from "axios";

const API_URL = "http://localhost:4000/api";

// Interfaces de tipos para los datos utilizados en la aplicación
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

// -------------------- WebSocket para Chat --------------------

let chatWs: WebSocket | null = null;

/**
 * Establece la conexión WebSocket para el chat.
 * @param onMessage Función que se ejecuta al recibir un mensaje.
 */
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

/**
 * Cierra la conexión WebSocket para el chat.
 */
export const disconnectChatWebSocket = () => {
  if (chatWs) {
    chatWs.close();
    chatWs = null;
  }
};

// -------------------- WebSocket para Documentos --------------------

/**
 * Establece la conexión WebSocket para documentos colaborativos.
 * @param onMessage Función que se ejecuta al recibir datos del documento.
 * @returns WebSocket activo
 */
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

/**
 * Cierra una conexión WebSocket de documento.
 * @param ws WebSocket a cerrar
 */
export const disconnectDocWebSocket = (ws: WebSocket | null) => {
  if (ws) {
    ws.close();
  }
};

// -------------------- Autenticación --------------------

/**
 * Inicia sesión con el correo de Gmail y devuelve los datos del usuario.
 * @param gmail Correo electrónico del usuario
 */
export const login = async (gmail: string): Promise<User> => {
  const response = await axios.post(`${API_URL}/auth/login`, { gmail });
  if (response.data.success) {
    return response.data.user;
  }
  throw new Error(response.data.message || "Error en iniciar sessió");
};

// -------------------- Chat --------------------

/**
 * Envía un mensaje al servidor.
 * @param emisorId ID del emisor
 * @param contenido Texto del mensaje
 */
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

/**
 * Obtiene el historial de mensajes del chat.
 */
export const getChatHistory = async (): Promise<Message[]> => {
  const response = await axios.get(`${API_URL}/chat/view_hist`);
  if (response.data.success) {
    return response.data.messages;
  }
  throw new Error(response.data.message || "Error en recuperar l’historial");
};

/**
 * Descarga el historial del chat en formato `.txt` o `.json`.
 * @param format Formato del archivo (por defecto es `txt`)
 */
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

// -------------------- Documentos --------------------

/**
 * Obtiene la lista de documentos disponibles.
 */
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const response = await axios.get(`${API_URL}/doc/list`);
    return response.data.documents;
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    throw error;
  }
};

/**
 * Crea un nuevo documento.
 * @param nombre Nombre del nuevo documento
 */
export const createDocument = async (nombre: string): Promise<Document> => {
  try {
    const response = await axios.post(`${API_URL}/doc/create`, { nombre });
    return response.data.document;
  } catch (error) {
    console.error("Error al crear documento:", error);
    throw error;
  }
};

/**
 * Obtiene un documento por su ID.
 * @param id ID del documento
 */
export const getDocument = async (id: string): Promise<Document> => {
  try {
    const response = await axios.get(`${API_URL}/doc/get/${id}`);
    return response.data.document;
  } catch (error) {
    console.error("Error al obtener el documento:", error);
    throw error;
  }
};

/**
 * Guarda el documento actual en el servidor.
 * @param docId ID del documento a guardar
 */
export const saveDocument = async (docId: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/doc/save_doc`, { docId });
  } catch (error) {
    console.error("Error al guardar el documento:", error);
    throw error;
  }
};

/**
 * Descarga un documento en formato `.txt` o `.pdf`.
 * @param id ID del documento
 * @param format Formato de descarga (txt o pdf)
 * @param nombre Nombre del archivo descargado
 */
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

// -------------------- Archivos compartidos --------------------

/**
 * Sube un archivo al servidor.
 * @param file Archivo a subir
 */
export const uploadFile = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    await axios.post(`${API_URL}/files/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    throw error;
  }
};

/**
 * Obtiene la lista de archivos compartidos disponibles.
 */
export const listFiles = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${API_URL}/files/list`);
    return response.data.files; // Se espera una respuesta como: { files: ["archivo1.txt", "archivo2.pdf", ...] }
  } catch (error) {
    console.error("Error al listar archivos:", error);
    throw error;
  }
};

/**
 * Descarga un archivo compartido por su nombre.
 * @param filename Nombre del archivo a descargar
 */
export const downloadFile = async (filename: string): Promise<void> => {
  try {
    const response = await axios.get(`${API_URL}/files/download/${filename}`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al descargar archivo:", error);
    throw error;
  }
};
