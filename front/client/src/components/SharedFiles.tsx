import React, { useEffect, useState } from "react";
import { downloadFile, listFiles, uploadFile } from "../api/api";
import "./SharedFiles.css";

const SharedFiles: React.FC = () => {
  // Estado que almacena la lista de nombres de archivos disponibles
  const [files, setFiles] = useState<string[]>([]);
  // Estado para guardar el archivo seleccionado para subir
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Estado que indica si se está realizando una subida (loading)
  const [uploading, setUploading] = useState(false);
  // Estado para almacenar mensajes de error en la UI
  const [error, setError] = useState<string | null>(null);

  // Efecto para cargar la lista de archivos al montar el componente
  useEffect(() => {
    fetchFiles();
  }, []);

  /**
   * Función que obtiene la lista de archivos del backend y actualiza el estado.
   * En caso de error, establece un mensaje de error.
   */
  const fetchFiles = async () => {
    try {
      const fileList = await listFiles();
      setFiles(fileList);
    } catch (err) {
      setError("Error al cargar archivos");
    }
  };

  /**
   * Función que maneja la subida de archivos seleccionados.
   * Desactiva la subida si no hay archivo seleccionado.
   * Actualiza el estado de carga y muestra errores en caso de fallo.
   * Refresca la lista de archivos tras la subida exitosa.
   */
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    try {
      await uploadFile(selectedFile);
      setSelectedFile(null);
      await fetchFiles();
    } catch (err) {
      setError("Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Función que maneja la descarga de un archivo.
   * Recibe el nombre del archivo a descargar.
   * Muestra error si la descarga falla.
   */
  const handleDownload = async (filename: string) => {
    try {
      await downloadFile(filename);
    } catch (err) {
      setError("Error al descargar el archivo");
    }
  };

  return (
    <div className="shared-files-container">
      {/* Título y botón para recargar la lista de archivos */}
      <div className="title-container">
        <h2>STUFILES</h2>
        <button
          className="reload-button"
          onClick={fetchFiles}
          title="Recargar archivos"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="reload-icon"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 5.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      {/* Sección para selección y subida de archivo */}
      <div className="file-upload">
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          aria-label="Seleccionar archivo para subir"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          aria-disabled={!selectedFile || uploading}
        >
          {uploading ? "Subiendo..." : "Subir"}
        </button>
      </div>

      {/* Muestra mensaje de error si existe */}
      {error && <p className="error-message">{error}</p>}

      {/* Lista de archivos disponibles para descarga */}
      <div className="file-list">
        {files.length > 0 ? (
          <ul>
            {files.map((file) => (
              <li key={file}>
                <span>{file}</span>
                <button
                  onClick={() => handleDownload(file)}
                  aria-label={`Descargar archivo ${file}`}
                >
                  Descargar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          // Contenido mostrado cuando no hay archivos
          <div className="empty-files-container">
            <div className="empty-files-icon">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M48 8H16C12.6863 8 10 10.6863 10 14V66C10 69.3137 12.6863 72 16 72H64C67.3137 72 70 69.3137 70 66V30L48 8Z"
                  fill="#E6F0FF"
                  stroke="#007BFF"
                  strokeWidth="2"
                />
                <path
                  d="M48 8V24C48 27.3137 50.6863 30 54 30H70"
                  stroke="#007BFF"
                  strokeWidth="2"
                />
                <path
                  d="M30 48H50M40 38V58"
                  stroke="#007BFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="empty-files-title">No hay archivos disponibles</p>
            <p className="empty-files-description">
              Sube tu primer archivo haciendo clic en el botón "Subir" o
              arrastrando un archivo a la zona de carga.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedFiles;
