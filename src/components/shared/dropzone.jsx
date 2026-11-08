import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import {
  DropzoneEmptyState,
  DropzoneRoot,
  DropzoneSinglePreview,
  DropzoneZone,
} from '@/components/ui/dropzone';
import { formatFileSize, getFileCategory } from '@/helpers/file';

/**
 * Maps react-dropzone rejection errors to localized Portuguese (BR) messages.
 */
function getLocalizedErrorMessage(
  error,
  file,
  { maxSize, minSize, maxFiles, accept }
) {
  switch (error.code) {
    case 'file-too-large':
      return `O arquivo "${file?.name || 'selecionado'}" excede o tamanho máximo de ${formatFileSize(maxSize)}.`;
    case 'file-too-small':
      return `O arquivo "${file?.name || 'selecionado'}" é menor que o tamanho mínimo de ${formatFileSize(minSize)}.`;
    case 'file-invalid-type': {
      const extensions = accept ? Object.values(accept).flat().join(', ') : '';
      return extensions
        ? `Formato não suportado. Aceitos: ${extensions}.`
        : 'Formato de arquivo não suportado.';
    }
    case 'too-many-files':
      return `Número máximo de arquivos atingido (máximo: ${maxFiles || 1}).`;
    default:
      return error.message || 'Arquivo inválido.';
  }
}

/**
 * Reusable Dropzone component supporting single-file selection,
 * drag-and-drop feedback, preview cards, validation, and object URL lifecycle cleanup.
 */
function Dropzone({
  value,
  defaultValue,
  onChange,
  onFileSelect,
  onError,
  accept,
  maxSize,
  minSize,
  maxFiles = 1,
  multiple = false,
  disabled = false,
  isUploading = false,
  initialPreviewUrl,
  title,
  description,
  hint,
  className,
  ...props
}) {
  const isControlled = value !== undefined;
  const [internalFile, setInternalFile] = useState(defaultValue || null);
  const [hasClearedInitial, setHasClearedInitial] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const currentFile = isControlled ? value : internalFile;
  const revokedUrlsRef = useRef(new Set());

  const revokeUrl = useCallback((url) => {
    if (
      url &&
      !revokedUrlsRef.current.has(url) &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      revokedUrlsRef.current.add(url);
      URL.revokeObjectURL(url);
    }
  }, []);

  const objectUrl = useMemo(() => {
    if (
      currentFile &&
      (getFileCategory(currentFile) === 'image' ||
        currentFile.type?.startsWith('image/'))
    ) {
      return typeof URL !== 'undefined' &&
        typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(currentFile)
        : null;
    }
    return null;
  }, [currentFile]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        revokeUrl(objectUrl);
      }
    };
  }, [objectUrl, revokeUrl]);

  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      if (fileRejections && fileRejections.length > 0) {
        const firstRejection = fileRejections[0];
        const firstError = firstRejection.errors[0] || {
          code: 'unknown',
          message: 'Arquivo inválido',
        };
        const localizedMsg = getLocalizedErrorMessage(
          firstError,
          firstRejection.file,
          {
            maxSize,
            minSize,
            maxFiles: multiple ? maxFiles : 1,
            accept,
          }
        );

        setErrorMessage(localizedMsg);
        onError?.({
          code: firstError.code,
          message: localizedMsg,
          file: firstRejection.file,
        });
        return;
      }

      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (objectUrl) {
          revokeUrl(objectUrl);
        }
        setErrorMessage(null);
        setHasClearedInitial(false);

        if (!isControlled) {
          setInternalFile(file);
        }
        onChange?.(file);
        onFileSelect?.(file);
      }
    },
    [
      accept,
      isControlled,
      maxFiles,
      maxSize,
      minSize,
      multiple,
      objectUrl,
      onChange,
      onError,
      onFileSelect,
      revokeUrl,
    ]
  );

  const hasActiveFile = Boolean(
    currentFile || (!hasClearedInitial && initialPreviewUrl)
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    minSize,
    maxFiles: multiple ? maxFiles : 1,
    multiple,
    disabled: disabled || isUploading,
    noClick: hasActiveFile,
  });

  const handleReplace = (e) => {
    e?.stopPropagation?.();
    open();
  };

  const handleRemove = (e) => {
    e?.stopPropagation?.();
    if (objectUrl) {
      revokeUrl(objectUrl);
    }
    setErrorMessage(null);
    setHasClearedInitial(true);

    if (!isControlled) {
      setInternalFile(null);
    }
    onChange?.(null);
    onFileSelect?.(null);
  };

  const computedHint =
    hint || (maxSize ? `Até ${formatFileSize(maxSize)} por arquivo` : null);

  const activeFile =
    currentFile ||
    (initialPreviewUrl
      ? { name: 'Imagem atual', size: 0, type: 'image/jpeg' }
      : null);

  const activePreviewUrl = objectUrl || initialPreviewUrl;

  return (
    <DropzoneRoot className={className} {...props}>
      <input {...getInputProps()} />

      {hasActiveFile && activeFile ? (
        <DropzoneSinglePreview
          file={activeFile}
          previewUrl={activePreviewUrl}
          onReplace={handleReplace}
          onRemove={handleRemove}
          disabled={disabled}
          isUploading={isUploading}
        />
      ) : (
        <DropzoneZone
          {...getRootProps()}
          isDragActive={isDragActive}
          isDragReject={isDragReject}
          isDragAccept={isDragAccept}
          disabled={disabled || isUploading}
        >
          <DropzoneEmptyState
            title={title}
            description={description}
            hint={computedHint}
            isDragActive={isDragActive}
            isDragReject={isDragReject}
          />
        </DropzoneZone>
      )}

      {errorMessage && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </DropzoneRoot>
  );
}

export { Dropzone };
export default Dropzone;
