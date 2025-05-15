import { useEffect, useRef, useState } from "react";
import {
  User,
  connectDocWebSocket,
  createDocument,
  disconnectDocWebSocket,
  downloadDocument,
  getDocument,
  saveDocument,
} from "../api/api";
import "./CollaborativeDoc.css";

// Definición del tipo Document que representa un documento colaborativo
interface Document {
  id: string;
  nombre: string;
  contenido: string;
  editores: string[]; // IDs de usuarios que están editando el documento
}

// Props del componente, recibe un usuario
interface CollaborativeDocProps {
  user: User;
}

/**
 * Componente principal para la edición colaborativa de documentos.
 * Permite crear, seleccionar, editar, guardar y descargar documentos en tiempo real.
 */
function CollaborativeDoc({ user }: CollaborativeDocProps) {
  // Estado que contiene la lista de documentos disponibles
  const [documents, setDocuments] = useState<Document[]>([]);

  // Documento actualmente seleccionado para edición
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Contenido actual del documento en el textarea
  const [content, setContent] = useState("");

  // Indica si la conexión WebSocket está activa
  const [isConnected, setIsConnected] = useState(false);

  // Nombre para crear un nuevo documento
  const [newDocName, setNewDocName] = useState("");

  // Contenido guardado más recientemente para control de cambios y guardado automático
  const [lastSavedContent, setLastSavedContent] = useState("");

  // Referencia al WebSocket para poder enviar y recibir mensajes
  const ws = useRef<WebSocket | null>(null);

  /**
   * useEffect que establece la conexión WebSocket al montar el componente.
   * Escucha los mensajes entrantes para actualizar la lista y el contenido de documentos.
   */
  useEffect(() => {
    // Conexión WebSocket con callback para manejar mensajes
    ws.current = connectDocWebSocket((data) => {
      const {
        type,
        docId,
        contenido,
        editorId,
        document,
        documents: docList,
      } = data;

      // Inicialización de la lista de documentos
      if (type === "initDocs" && docList) {
        setDocuments(docList);

        // Selecciona el primer documento si no hay uno seleccionado
        if (docList.length > 0 && !selectedDoc) {
          const firstDoc = docList[0];
          setSelectedDoc(firstDoc);
          setContent(firstDoc.contenido);
          setLastSavedContent(firstDoc.contenido);
        }
      }

      // Inicializa el contenido de un documento seleccionado (solo si coincide el id)
      if (type === "initDoc" && docId && selectedDoc?.id === docId) {
        setContent(contenido);
        setLastSavedContent(contenido);
      }

      // Actualiza el contenido del documento si se recibe un update para el documento activo
      if (
        type === "update" &&
        docId &&
        contenido !== undefined &&
        selectedDoc?.id === docId
      ) {
        setContent(contenido);

        // Actualiza también la lista de documentos con el contenido nuevo
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === docId ? { ...doc, contenido } : doc))
        );
      }

      // Añade un nuevo documento a la lista si no existe ya
      if (
        type === "newDoc" &&
        document &&
        !documents.find((d) => d.id === document.id)
      ) {
        setDocuments((prev) => [...prev, document]);
      }
    });

    // Marca la conexión como activa
    setIsConnected(true);

    // Cleanup: desconecta el WebSocket y actualiza estado al desmontar
    return () => {
      disconnectDocWebSocket(ws.current);
      setIsConnected(false);
    };
  }, [selectedDoc]);

  /**
   * useEffect para implementar guardado automático del documento
   * Cada 3 segundos intenta guardar si el contenido ha cambiado desde el último guardado
   */
  useEffect(() => {
    const autosaveInterval = setInterval(async () => {
      if (selectedDoc && content !== lastSavedContent) {
        try {
          await saveDocument(selectedDoc.id);
          setLastSavedContent(content);
          console.log(
            "Documento guardado automáticamente a las",
            new Date().toLocaleTimeString()
          );
        } catch (error) {
          console.error("Error al guardar automáticamente:", error);
        }
      }
    }, 3000);

    // Limpia el intervalo al desmontar o cambiar dependencias
    return () => clearInterval(autosaveInterval);
  }, [selectedDoc, content, lastSavedContent]);

  /**
   * Función para crear un nuevo documento
   * Valida que el nombre no esté vacío y luego lo crea en el backend
   * Actualiza la lista y selecciona el nuevo documento
   */
  const handleCreateDoc = async () => {
    if (!newDocName.trim()) {
      alert("Por favor, ingresa un nombre para el documento");
      return;
    }

    try {
      const newDoc = await createDocument(newDocName);
      setDocuments((prev) => [
        ...prev.filter((d) => d.id !== newDoc.id), // elimina duplicados si los hubiera
        newDoc,
      ]);
      setSelectedDoc(newDoc);
      setContent(newDoc.contenido);
      setLastSavedContent(newDoc.contenido);
      setNewDocName("");
    } catch (error) {
      console.error("Error al crear documento:", error);
    }
  };

  /**
   * Maneja la selección de un documento distinto
   * Carga su contenido y actualiza el estado, solicita el documento al servidor via WS
   */
  const handleSelectDoc = async (doc: Document) => {
    if (selectedDoc?.id !== doc.id) {
      setSelectedDoc(doc);

      try {
        const updatedDoc = await getDocument(doc.id);
        setContent(updatedDoc.contenido);
        setLastSavedContent(updatedDoc.contenido);

        setDocuments((prev) =>
          prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
        );

        // Solicita actualización al servidor por WebSocket
        if (ws.current && ws.current.readyState === 1) {
          ws.current.send(
            JSON.stringify({ type: "requestDoc", docId: doc.id })
          );
        }
      } catch (error) {
        console.error("Error al cargar el documento:", error);
        // En caso de error, usa contenido almacenado localmente
        setContent(doc.contenido);
        setLastSavedContent(doc.contenido);
      }
    }
  };

  /**
   * Maneja el cambio de contenido en el textarea
   * Actualiza el estado local y envía la actualización por WebSocket
   */
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (ws.current && ws.current.readyState === 1 && selectedDoc) {
      ws.current.send(
        JSON.stringify({
          type: "update",
          docId: selectedDoc.id,
          contenido: newContent,
          editorId: user.id,
        })
      );
    }
  };

  /**
   * Descarga el documento seleccionado en formato txt o pdf
   */
  const handleDownload = async (format: "txt" | "pdf") => {
    if (selectedDoc) {
      try {
        await downloadDocument(selectedDoc.id, format, selectedDoc.nombre);
      } catch (err) {
        console.error("Error al descargar el documento:", err);
      }
    }
  };

  return (
    <div className="collaborative-doc-container">
      {/* Barra lateral con listado de documentos y creación de nuevos */}
      <div className="doc-sidebar">
        <h3 style={{ marginInline: "20px" }}>STUDOCS</h3>
        <div className="doc-controls">
          <input
            type="text"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            placeholder="Nombre del nuevo documento"
            className="doc-name-input"
          />
          <button onClick={handleCreateDoc} className="create-doc-button">
            Crear Nuevo Documento
          </button>
        </div>
        <div className="doc-select">
          {/* Botones para seleccionar documentos existentes */}
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleSelectDoc(doc)}
              className={`doc-button ${
                selectedDoc?.id === doc.id ? "active" : ""
              }`}
            >
              {doc.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Área principal para mostrar y editar el contenido del documento */}
      <div className="doc-content">
        {isConnected && selectedDoc ? (
          <>
            {/* Botones para descargar en diferentes formatos */}
            <div className="download-buttons">
              <button onClick={() => handleDownload("txt")}>
                Descargar TXT
              </button>
              <button onClick={() => handleDownload("pdf")}>
                Descargar PDF
              </button>
            </div>
            {/* Textarea para edición colaborativa */}
            <textarea
              value={content}
              onChange={handleContentChange}
              className="doc-textarea"
              placeholder="Escribe aquí..."
            />
          </>
        ) : (
          // Mensaje o ilustración para cuando no hay documento seleccionado o conexión establecida
          <p className="doc-placeholder">
            {selectedDoc ? (
              "Conectando al documento colaborativo..."
            ) : (
              <div className="empty-doc-container">
                <div className="empty-doc-icon">
                  <svg
                    width="100"
                    height="100"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* SVG ilustrativo de documento vacío */}
                    <path
                      d="M70 15H25C21.1340 15 18 18.1340 18 22V78C18 81.8660 21.1340 85 25 85H75C78.8660 85 82 81.8660 82 78V27L70 15Z"
                      fill="#E6F0FF"
                      stroke="#007BFF"
                      strokeWidth="2"
                    />
                    <path
                      d="M70 15V22C70 24.7614 72.2386 27 75 27H82"
                      stroke="#007BFF"
                      strokeWidth="2"
                    />
                    <path
                      d="M30 40H70M30 52H70M30 64H50"
                      stroke="#007BFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="62"
                      cy="64"
                      r="12"
                      fill="#E6F0FF"
                      stroke="#007BFF"
                      strokeWidth="2"
                    />
                    <path
                      d="M62 58V70M56 64H68"
                      stroke="#007BFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="empty-doc-title">
                  No hay documentos seleccionados
                </h3>
                <p className="empty-doc-description">
                  Crea un nuevo documento o selecciona uno existente para
                  comenzar a editar. Los documentos te permiten colaborar en
                  tiempo real con otros usuarios.
                </p>
              </div>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export default CollaborativeDoc;
