"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

const DEFAULT_ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const DEFAULT_ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

const DEFAULT_MAXIMUM_FILE_SIZE = 10 * 1024 * 1024;

export type UseDocumentUploadOptions = {
  acceptedMimeTypes?: string[];
  acceptedExtensions?: string[];
  maximumFileSize?: number;
  invalidTypeMessage?: string;
  maximumSizeMessage?: string;
  onBeforeSelect?: () => void;
  onFileAccepted?: (file: File) => void;
  onRemove?: () => void;
};

export default function useDocumentUpload({
  acceptedMimeTypes = DEFAULT_ACCEPTED_MIME_TYPES,
  acceptedExtensions = DEFAULT_ACCEPTED_EXTENSIONS,
  maximumFileSize = DEFAULT_MAXIMUM_FILE_SIZE,
  invalidTypeMessage =
    "Envie um arquivo PDF, JPG, PNG ou WEBP.",
  maximumSizeMessage =
    "O arquivo deve ter no máximo 10 MB.",
  onBeforeSelect,
  onFileAccepted,
  onRemove,
}: UseDocumentUploadOptions = {}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function clearInput(): void {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function validateFile(
    selectedFile: File
  ): string | null {
    const lowerFileName =
      selectedFile.name.toLowerCase();

    const hasAcceptedMimeType =
      acceptedMimeTypes.includes(selectedFile.type);

    const hasAcceptedExtension =
      acceptedExtensions.some((extension) =>
        lowerFileName.endsWith(
          extension.toLowerCase()
        )
      );

    if (
      !hasAcceptedMimeType &&
      !hasAcceptedExtension
    ) {
      return invalidTypeMessage;
    }

    if (selectedFile.size > maximumFileSize) {
      return maximumSizeMessage;
    }

    return null;
  }

  function selectFile(selectedFile: File): boolean {
    onBeforeSelect?.();
    setError(null);

    const validationError =
      validateFile(selectedFile);

    if (validationError) {
      setFile(null);
      setError(validationError);
      clearInput();
      return false;
    }

    setFile(selectedFile);
    onFileAccepted?.(selectedFile);

    return true;
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    selectFile(selectedFile);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ): void {
    event.preventDefault();
    event.stopPropagation();

    setDragging(false);

    const selectedFile =
      event.dataTransfer.files?.[0];

    if (!selectedFile) {
      return;
    }

    selectFile(selectedFile);
  }

  function resetFile(): void {
    setFile(null);
    setError(null);
    setDragging(false);
    clearInput();
  }

  function removeFile(): void {
    resetFile();
    onRemove?.();
  }

  return {
    inputRef,
    file,
    error,
    dragging,
    setFile,
    setError,
    setDragging,
    validateFile,
    selectFile,
    handleChange,
    handleDrop,
    resetFile,
    removeFile,
  };
}
