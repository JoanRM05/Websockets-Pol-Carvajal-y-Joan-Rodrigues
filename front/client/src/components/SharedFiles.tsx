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
          <p className="text-sm text-gray-600">No hay archivos disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default SharedFiles;
