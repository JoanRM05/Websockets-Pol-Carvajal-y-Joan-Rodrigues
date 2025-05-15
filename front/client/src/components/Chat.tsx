import { useEffect, useRef, useState } from "react";
import {
  Message,
  User,
  connectChatWebSocket,
  disconnectChatWebSocket,
  downloadChatHistory,
  getChatHistory,
  sendMessage,
} from "../api/api";
import "./Chat.css";

// Props del componente Chat
interface ChatProps {
  user: User;
}

function Chat({ user }: ChatProps) {
  // Estado para los mensajes del día actual
  const [messages, setMessages] = useState<Message[]>([]);

  // Estado para el nuevo mensaje a enviar
  const [newMessage, setNewMessage] = useState("");

  // Estado para errores
  const [error, setError] = useState("");

  // Estado para el formato de descarga del historial
  const [downloadFormat, setDownloadFormat] = useState<"txt" | "json">("txt");

  // Referencia al contenedor del chat para hacer scroll automático
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fecha formateada (dd/mm/yyyy)
  const today = new Date();
  const formattedDate = today
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .split("/")
    .join("/");

  /**
   * useEffect para:
   * - Cargar historial de mensajes del día actual.
   * - Establecer conexión WebSocket para recibir nuevos mensajes en tiempo real.
   * - Limpiar la conexión WebSocket al desmontar el componente.
   */
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const history = await getChatHistory();
        const today = new Date();
        // Filtrar mensajes del día actual
        const filteredMessages = history.filter((msg) => {
          const msgDate = new Date(msg.timestamp);
          return (
            msgDate.getDate() === today.getDate() &&
            msgDate.getMonth() === today.getMonth() &&
            msgDate.getFullYear() === today.getFullYear()
          );
        });
        setMessages(filteredMessages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error en carregar l’historial"
        );
      }
    };

    fetchInitialMessages();

    // Conectar WebSocket para recibir mensajes en tiempo real
    connectChatWebSocket((message) => {
      const today = new Date();
      const msgDate = new Date(message.timestamp);
      // Aceptar solo mensajes del día actual
      if (
        msgDate.getDate() === today.getDate() &&
        msgDate.getMonth() === today.getMonth() &&
        msgDate.getFullYear() === today.getFullYear()
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    // Desconectar WebSocket al desmontar
    return () => {
      disconnectChatWebSocket();
    };
  }, []);

  /**
   * useEffect para hacer scroll automático hacia el final del chat
   * cada vez que se actualizan los mensajes.
   */
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Maneja el envío de un nuevo mensaje
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage(user.id, newMessage);
      setNewMessage("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error en enviar el missatge"
      );
    }
  };

  /**
   * Maneja la descarga del historial del chat
   */
  const handleDownloadChat = async () => {
    try {
      await downloadChatHistory(downloadFormat);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al descargar el chat"
      );
    }
  };

  /**
   * Formatea la hora desde un timestamp ISO
   */
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="chat-section">
      {/* Título del chat y fecha actual */}
      <h2 className="chat-title">
        <p> STUCHAT </p>
        <small style={{ fontSize: "17px" }}>{formattedDate}</small>
      </h2>

      {/* Contenedor principal del chat */}
      <div className="chat-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          // Mensaje cuando no hay mensajes aún
          <div className="empty-chat-container">
            {/* SVG decorativo (pollito con notas musicales) */}
            <svg viewBox="0 0 200 200" className="chick-svg">
              {/* Cuerpo del pollito */}
              <ellipse cx="100" cy="120" rx="50" ry="45" fill="#FFEB3B" />
              {/* Cabeza */}
              <circle cx="100" cy="65" r="35" fill="#FFEB3B" />
              {/* Ojos */}
              <circle cx="85" cy="55" r="5" fill="#333" />
              <circle cx="115" cy="55" r="5" fill="#333" />
              {/* Pico */}
              <polygon points="100,65 90,75 110,75" fill="#FF9800" />
              {/* Alas */}
              <ellipse
                cx="55"
                cy="120"
                rx="15"
                ry="25"
                fill="#FFF59D"
                transform="rotate(-20 55 120)"
              />
              <ellipse
                cx="145"
                cy="120"
                rx="15"
                ry="25"
                fill="#FFF59D"
                transform="rotate(20 145 120)"
              />
              {/* Patas */}
              <rect x="85" y="165" width="5" height="20" fill="#FF9800" />
              <rect x="110" y="165" width="5" height="20" fill="#FF9800" />
              {/* Notas musicales flotando */}
              <g className="music-notes">
                <path
                  d="M150,30 Q155,20 160,30"
                  stroke="#555"
                  fill="transparent"
                  strokeWidth="2"
                />
                <circle cx="160" cy="30" r="4" fill="#555" />
                <path
                  d="M165,45 Q170,35 175,45"
                  stroke="#555"
                  fill="transparent"
                  strokeWidth="2"
                />
                <circle cx="175" cy="45" r="4" fill="#555" />
                <path
                  d="M140,15 Q145,5 150,15"
                  stroke="#555"
                  fill="transparent"
                  strokeWidth="2"
                />
                <circle cx="150" cy="15" r="4" fill="#555" />
              </g>
            </svg>
            <p className="empty-chat-message">
              No hay mensajes en el chat hoy.
            </p>
            <p className="empty-chat-subtext">
              ¡Sé el primero en iniciar la conversación!
            </p>
          </div>
        ) : (
          // Mostrar mensajes del chat
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${
                msg.emisorId === user.id ? "sent" : "received"
              }`}
            >
              <p className="message-meta">
                <b>{msg.emisorId === user.id ? "Tú" : msg.emisorName}</b>
                <small> - {formatTime(msg.timestamp)}</small>
              </p>
              <p>{msg.contenido}</p>
            </div>
          ))
        )}
      </div>

      {/* Mostrar errores, si los hay */}
      {error && <p className="error-message">{error}</p>}

      {/* Formulario para enviar nuevos mensajes */}
      <form className="chat-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="chat-button">
          Enviar
        </button>
      </form>

      {/* Sección de descarga del historial */}
      <div className="download-section">
        <button className="download-button" onClick={handleDownloadChat}>
          Descargar Chat
        </button>
        <select
          value={downloadFormat}
          onChange={(e) => setDownloadFormat(e.target.value as "txt" | "json")}
          className="download-format-select"
        >
          <option value="txt">.txt</option>
          <option value="json">.json</option>
        </select>
      </div>
    </div>
  );
}

export default Chat;
