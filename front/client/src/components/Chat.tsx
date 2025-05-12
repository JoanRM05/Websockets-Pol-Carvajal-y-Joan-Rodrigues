import { useEffect, useRef, useState } from "react";
import {
  Message,
  User,
  connectWebSocket,
  disconnectWebSocket,
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

  // Obtener la fecha actual en formato day/month/year
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
    connectWebSocket((message) => {
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
      disconnectWebSocket();
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

  // Función para formatear solo la hora y los minutos
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="chat-section">
      <h2 className="chat-title">SALA: {formattedDate}</h2>
      <div className="chat-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <p className="no-messages">No hay mensajes aún hoy.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${
                msg.emisorId === user.id ? "sent" : "received"
              }`}
            >
              <p className="message-meta">
                <small>{formatTime(msg.timestamp)} - </small>
                <b>{msg.emisorId === user.id ? "Tú" : msg.emisorName}</b>
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
        <select
          value={downloadFormat}
          onChange={(e) => setDownloadFormat(e.target.value as "txt" | "json")}
          className="download-format-select"
        >
          <option value="txt">Descargar como .txt</option>
          <option value="json">Descargar como .json</option>
        </select>
        <button className="download-button" onClick={handleDownloadChat}>
          Descargar Chat
        </button>
      </div>
    </div>
  );
}

export default Chat;
