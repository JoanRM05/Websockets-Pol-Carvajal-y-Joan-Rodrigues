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

interface ChatProps {
  user: User;
}

function Chat({ user }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const [downloadFormat, setDownloadFormat] = useState<"txt" | "json">("txt");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const formattedDate = today
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .split("/")
    .join("/");

  useEffect(() => {
    // Cargar historial inicial y filtrar mensajes del día actual
    const fetchInitialMessages = async () => {
      try {
        const history = await getChatHistory();
        const today = new Date();
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

    // Conectar WebSocket para recibir mensajes en tiempo real y filtrar
    connectChatWebSocket((message) => {
      const today = new Date();
      const msgDate = new Date(message.timestamp);
      if (
        msgDate.getDate() === today.getDate() &&
        msgDate.getMonth() === today.getMonth() &&
        msgDate.getFullYear() === today.getFullYear()
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    // Desconectar al desmontar
    return () => {
      disconnectChatWebSocket();
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleDownloadChat = async () => {
    try {
      await downloadChatHistory(downloadFormat);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al descargar el chat"
      );
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="chat-section">
      <h2 className="chat-title">
        <p> STUCHAT </p>
        <small style={{ fontSize: "17px" }}>{formattedDate}</small>
      </h2>
      <div className="chat-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-chat-container">
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
              <rect x="85" cy="165" width="5" height="20" fill="#FF9800" />
              <rect x="110" cy="165" width="5" height="20" fill="#FF9800" />

              {/* Notas musicales */}
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
      {error && <p className="error-message">{error}</p>}
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
