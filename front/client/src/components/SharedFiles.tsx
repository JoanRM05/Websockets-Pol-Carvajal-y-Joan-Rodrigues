import React, { useEffect, useState } from "react";
import { downloadFile, listFiles, uploadFile } from "../api/api";
import "./SharedFiles.css";

const SharedFiles: React.FC = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const fileList = await listFiles();
      setFiles(fileList);
    } catch (err) {
      setError("Error al cargar archivos");
    }
  };

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

  const handleDownload = async (filename: string) => {
    try {
      await downloadFile(filename);
    } catch (err) {
      setError("Error al descargar el archivo");
    }
  };

  return (
    <div className="shared-files-container">
      <h2>Archivos compartidos</h2>

      <div className="file-upload">
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
        <button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? "Subiendo..." : "Subir"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="file-list">
        {files.length > 0 ? (
          <ul>
            {files.map((file) => (
              <li key={file}>
                <span>{file}</span>
                <button onClick={() => handleDownload(file)}>Descargar</button>
              </li>
            ))}
          </ul>
        ) : (
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
