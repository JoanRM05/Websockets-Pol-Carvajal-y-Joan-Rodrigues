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

interface Document {
  id: string;
  nombre: string;
  contenido: string;
  editores: string[];
}

interface CollaborativeDocProps {
  user: User;
}

function CollaborativeDoc({ user }: CollaborativeDocProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [content, setContent] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = connectDocWebSocket((data) => {
      const {
        type,
        docId,
        contenido,
        editorId,
        document,
        documents: docList,
      } = data;

      if (type === "initDocs" && docList) {
        setDocuments(docList);
        if (docList.length > 0 && !selectedDoc) {
          const firstDoc = docList[0];
          setSelectedDoc(firstDoc);
          setContent(firstDoc.contenido);
          setLastSavedContent(firstDoc.contenido);
        }
      }

      if (type === "initDoc" && docId && selectedDoc?.id === docId) {
        setContent(contenido);
        setLastSavedContent(contenido);
      }

      if (
        type === "update" &&
        docId &&
        contenido !== undefined &&
        selectedDoc?.id === docId
      ) {
        setContent(contenido);
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === docId ? { ...doc, contenido } : doc))
        );
      }

      if (
        type === "newDoc" &&
        document &&
        !documents.find((d) => d.id === document.id)
      ) {
        setDocuments((prev) => [...prev, document]);
      }
    });

    setIsConnected(true);

    return () => {
      disconnectDocWebSocket(ws.current);
      setIsConnected(false);
    };
  }, [selectedDoc]);

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

    return () => clearInterval(autosaveInterval);
  }, [selectedDoc, content, lastSavedContent]);

  const handleCreateDoc = async () => {
    if (!newDocName.trim()) {
      alert("Por favor, ingresa un nombre para el documento");
      return;
    }

    try {
      const newDoc = await createDocument(newDocName);
      setDocuments((prev) => [
        ...prev.filter((d) => d.id !== newDoc.id),
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

        if (ws.current && ws.current.readyState === 1) {
          ws.current.send(
            JSON.stringify({ type: "requestDoc", docId: doc.id })
          );
        }
      } catch (error) {
        console.error("Error al cargar el documento:", error);
        setContent(doc.contenido);
        setLastSavedContent(doc.contenido);
      }
    }
  };

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

      <div className="doc-content">
        {isConnected && selectedDoc ? (
          <>
            <div className="download-buttons">
              <button onClick={() => handleDownload("txt")}>
                Descargar TXT
              </button>
              <button onClick={() => handleDownload("pdf")}>
                Descargar PDF
              </button>
            </div>
            <textarea
              value={content}
              onChange={handleContentChange}
              className="doc-textarea"
              placeholder="Escribe aquí..."
            />
          </>
        ) : (
          <p className="doc-placeholder">
            {selectedDoc
              ? "Conectando al documento colaborativo..."
              : <div className="empty-doc-container">
              <div className="empty-doc-icon">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
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
              <h3 className="empty-doc-title">No hay documentos seleccionados</h3>
              <p className="empty-doc-description">
                Crea un nuevo documento o selecciona uno existente para comenzar a editar.
                Los documentos te permiten colaborar en tiempo real con otros usuarios.
              </p>
            </div>}
          </p>
        )}
      </div>
    </div>
  );
}

export default CollaborativeDoc;
