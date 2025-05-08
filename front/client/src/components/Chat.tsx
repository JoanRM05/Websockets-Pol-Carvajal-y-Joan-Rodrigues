import { useEffect, useRef, useState } from "react";
import { Message, User, connectWebSocket, disconnectWebSocket, getChatHistory, sendMessage } from "../api/api";
import "./Chat.css";

interface ChatProps {
  user: User;
}

function Chat({ user }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar historial inicial
    const fetchInitialMessages = async () => {
      try {
        const history = await getChatHistory();
        setMessages(history);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error en carregar l’historial"
        );
      }
    };
    fetchInitialMessages();

    // Conectar WebSocket para recibir mensajes en tiempo real
    connectWebSocket((message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      console
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

  return (
    <div className="chat-section">
      <h2 className="chat-title">Sala</h2>
      <div className="chat-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <p className="no-messages">No hay mensajes aún.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${
                msg.emisorId === user.id ? "sent" : "received"
              }`}
            >
              <p className="message-meta">
                {new Date(msg.timestamp).toLocaleString()} -{" "}
                {msg.emisorId === user.id ? "Tú" : msg.emisorName}
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
    </div>
  );
}

export default Chat;