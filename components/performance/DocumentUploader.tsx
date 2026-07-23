"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ChangeEventHandler,
  type CSSProperties,
  type DragEventHandler,
} from "react";

type UploaderStyles = {
  area: CSSProperties;
  input: CSSProperties;
  selectButton: CSSProperties;
  uploadLabel: CSSProperties;
  uploadTitle: CSSProperties;
  uploadDescription: CSSProperties;
  uploadFormats: CSSProperties;
  selectedFile: CSSProperties;
  selectedFileHeader: CSSProperties;
  selectedFileInfo: CSSProperties;
  fileTypeBadge: CSSProperties;
  fileTextArea: CSSProperties;
  fileName: CSSProperties;
  fileMetadata: CSSProperties;
  removeFileButton: CSSProperties;
  fileReady: CSSProperties;
  analyzeButton: CSSProperties;
  nextStepText: CSSProperties;
  error: CSSProperties;
};

export type DocumentUploaderProps = {
  file: File | null;
  error: string | null;
  dragging: boolean;
  analyzing: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onDrop: DragEventHandler<HTMLDivElement>;
  onDragStateChange: (dragging: boolean) => void;
  onRemove: () => void;
  onAnalyze: () => void;
  styles: UploaderStyles;
};

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} bytes`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DocumentUploader = forwardRef<
  HTMLInputElement,
  DocumentUploaderProps
>(function DocumentUploader(
  {
    file,
    error,
    dragging,
    analyzing,
    onChange,
    onDrop,
    onDragStateChange,
    onRemove,
    onAnalyze,
    styles,
  },
  forwardedRef
) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(
    forwardedRef,
    () => inputRef.current as HTMLInputElement
  );

  function handleBrowse(): void {
    inputRef.current?.click();
  }

  function handleDragEnter(
    event: React.DragEvent<HTMLDivElement>
  ): void {
    event.preventDefault();
    event.stopPropagation();
    onDragStateChange(true);
  }

  function handleDragOver(
    event: React.DragEvent<HTMLDivElement>
  ): void {
    event.preventDefault();
    event.stopPropagation();
    onDragStateChange(true);
  }

  function handleDragLeave(
    event: React.DragEvent<HTMLDivElement>
  ): void {
    event.preventDefault();
    event.stopPropagation();
    onDragStateChange(false);
  }

  return (
    <>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onDrop}
        style={{
          ...styles.area,
          borderColor: dragging
            ? "rgba(255,255,255,0.65)"
            : "rgba(255,255,255,0.18)",
          background: dragging
            ? "rgba(255,255,255,0.075)"
            : "rgba(255,255,255,0.025)",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          disabled={analyzing}
          onChange={onChange}
          style={styles.input}
        />

        {!file ? (
          <>
            <div style={styles.uploadLabel}>
              Leitura automática
            </div>

            <div style={styles.uploadTitle}>
              Envie o laudo da bioimpedância
            </div>

            <p style={styles.uploadDescription}>
              Selecione um PDF ou uma imagem do laudo. No
              computador, você também pode arrastar o arquivo
              para esta área.
            </p>

            <button
              type="button"
              onClick={handleBrowse}
              disabled={analyzing}
              style={styles.selectButton}
            >
              Selecionar PDF ou imagem
            </button>

            <div style={styles.uploadFormats}>
              PDF, JPG, PNG ou WEBP · máximo de 10 MB
            </div>
          </>
        ) : (
          <div style={styles.selectedFile}>
            <div style={styles.selectedFileHeader}>
              <div style={styles.selectedFileInfo}>
                <div style={styles.fileTypeBadge}>
                  {file.type === "application/pdf" ||
                  file.name.toLowerCase().endsWith(".pdf")
                    ? "PDF"
                    : "IMG"}
                </div>

                <div style={styles.fileTextArea}>
                  <div style={styles.fileName}>
                    {file.name}
                  </div>

                  <div style={styles.fileMetadata}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onRemove}
                disabled={analyzing}
                style={{
                  ...styles.removeFileButton,
                  opacity: analyzing ? 0.45 : 1,
                  cursor: analyzing
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Remover
              </button>
            </div>

            <div style={styles.fileReady}>
              Arquivo pronto para análise
            </div>

            <button
              type="button"
              onClick={onAnalyze}
              disabled={analyzing}
              style={{
                ...styles.analyzeButton,
                opacity: analyzing ? 0.55 : 1,
                cursor: analyzing
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {analyzing
                ? "Analisando documento..."
                : "Analisar com IA"}
            </button>

            <div style={styles.nextStepText}>
              {analyzing
                ? "A leitura pode levar alguns segundos."
                : "Os campos abaixo serão preenchidos automaticamente."}
            </div>
          </div>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}
    </>
  );
});

export default DocumentUploader;
