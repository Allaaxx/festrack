import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import {
  DropzoneEmptyState,
  DropzoneFileItem,
  DropzoneFileList,
  DropzoneFoldedStrip,
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
  { maxSize, minSize, maxFiles, totalSizeLimit, accept }
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
    case 'total-size-too-large':
      return `O tamanho total dos arquivos excede o limite de ${formatFileSize(totalSizeLimit)}.`;
    default:
      return error.message || 'Arquivo inválido.';
  }
}

/**
 * Reusable Dropzone component supporting single-item preview,
 * multi-item folding dropzone, drag-and-drop feedback, validation,
 * enriched callbacks, and object URL lifecycle cleanup.
 */
function Dropzone({
  value,
  defaultValue,
  onChange,
  onFileSelect,
  onFilesChange,
  onError,
  accept,
  maxSize,
  minSize,
  maxFiles,
  totalSizeLimit,
  multiple = false,
  disabled = false,
  isUploading = false,
  initialPreviewUrl,
  previewAlt = 'Imagem atual',
  title,
  description,
  hint,
  foldedTitle,
  foldedDescription,
  folderTitle = 'Na pasta',
  showClearAll = true,
  className,
  ...props
}) {
  const isControlled = value !== undefined;

  // Single-file state
  const [internalFile, setInternalFile] = useState(defaultValue || null);
  const [hasClearedInitial, setHasClearedInitial] = useState(false);
  const prevInitialUrlRef = useRef(initialPreviewUrl);

  useEffect(() => {
    if (prevInitialUrlRef.current !== initialPreviewUrl) {
      prevInitialUrlRef.current = initialPreviewUrl;
      setHasClearedInitial(false);
    }
  }, [initialPreviewUrl]);

  // Multi-file state
  const [internalFiles, setInternalFiles] = useState(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });
  const [previewMap, setPreviewMap] = useState(() => {
    const map = new Map();
    const initialList = defaultValue
      ? Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue]
      : value
        ? Array.isArray(value)
          ? value
          : [value]
        : [];
    initialList.forEach((file) => {
      if (
        (getFileCategory(file) === 'image' ||
          file.type?.startsWith('image/')) &&
        typeof URL !== 'undefined' &&
        typeof URL.createObjectURL === 'function'
      ) {
        map.set(file, URL.createObjectURL(file));
      }
    });
    return map;
  });

  const [errorMessage, setErrorMessage] = useState(null);

  const revokedUrlsRef = useRef(new Set());
  const previewMapRef = useRef(previewMap);

  useEffect(() => {
    previewMapRef.current = previewMap;
  }, [previewMap]);

  const currentFile = isControlled ? value : internalFile;
  const currentFiles = useMemo(() => {
    if (isControlled) {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    }
    return internalFiles;
  }, [isControlled, value, internalFiles]);

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

  // Single file preview URL
  const objectUrl = useMemo(() => {
    if (
      !multiple &&
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
  }, [currentFile, multiple]);

  // Clean single objectUrl
  useEffect(() => {
    return () => {
      if (objectUrl) {
        revokeUrl(objectUrl);
      }
    };
  }, [objectUrl, revokeUrl]);

  // Clean all preview URLs on unmount
  useEffect(() => {
    return () => {
      previewMapRef.current.forEach((url) => {
        revokeUrl(url);
      });
    };
  }, [revokeUrl]);

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
            totalSizeLimit,
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
        if (multiple) {
          // Check maxFiles constraint
          if (
            maxFiles &&
            currentFiles.length + acceptedFiles.length > maxFiles
          ) {
            const localizedMsg = `Número máximo de arquivos atingido (máximo: ${maxFiles}).`;
            setErrorMessage(localizedMsg);
            onError?.({
              code: 'too-many-files',
              message: localizedMsg,
              file: acceptedFiles[0],
            });
            return;
          }

          // Check cumulative totalSizeLimit
          if (totalSizeLimit) {
            const currentTotal = currentFiles.reduce(
              (acc, f) => acc + (f.size || 0),
              0
            );
            const incomingTotal = acceptedFiles.reduce(
              (acc, f) => acc + (f.size || 0),
              0
            );
            if (currentTotal + incomingTotal > totalSizeLimit) {
              const localizedMsg = `O tamanho total dos arquivos excede o limite de ${formatFileSize(totalSizeLimit)}.`;
              setErrorMessage(localizedMsg);
              onError?.({
                code: 'total-size-too-large',
                message: localizedMsg,
                file: acceptedFiles[0],
              });
              return;
            }
          }

          // Generate preview URLs for newly accepted image files
          const nextPreviews = new Map(previewMap);
          acceptedFiles.forEach((file) => {
            if (
              getFileCategory(file) === 'image' ||
              file.type?.startsWith('image/')
            ) {
              if (
                typeof URL !== 'undefined' &&
                typeof URL.createObjectURL === 'function' &&
                !nextPreviews.has(file)
              ) {
                const url = URL.createObjectURL(file);
                nextPreviews.set(file, url);
              }
            }
          });

          setPreviewMap(nextPreviews);

          const updatedFiles = [...currentFiles, ...acceptedFiles];
          setErrorMessage(null);

          if (!isControlled) {
            setInternalFiles(updatedFiles);
          }

          const enrichedItems = updatedFiles.map((file, idx) => ({
            id: `${file.name}-${file.size}-${file.lastModified || idx}`,
            file,
            preview: nextPreviews.get(file) || null,
            name: file.name,
            size: file.size,
            type: file.type,
          }));

          onChange?.(updatedFiles);
          onFileSelect?.(updatedFiles);
          onFilesChange?.(enrichedItems);
        } else {
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

          const singleEnriched = [
            {
              id: `${file.name}-${file.size}-${file.lastModified || 0}`,
              file,
              preview:
                getFileCategory(file) === 'image' ||
                file.type?.startsWith('image/')
                  ? typeof URL !== 'undefined' &&
                    typeof URL.createObjectURL === 'function'
                    ? URL.createObjectURL(file)
                    : null
                  : null,
              name: file.name,
              size: file.size,
              type: file.type,
            },
          ];
          onFilesChange?.(singleEnriched);
        }
      }
    },
    [
      accept,
      currentFiles,
      isControlled,
      maxFiles,
      maxSize,
      minSize,
      multiple,
      objectUrl,
      onChange,
      onError,
      onFileSelect,
      onFilesChange,
      previewMap,
      revokeUrl,
      totalSizeLimit,
    ]
  );

  const hasActiveFile = Boolean(
    currentFile || (!hasClearedInitial && initialPreviewUrl)
  );
  const hasFiles = multiple ? currentFiles.length > 0 : hasActiveFile;

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
    maxFiles: multiple ? (maxFiles > 0 ? maxFiles : undefined) : 1,
    multiple,
    disabled: disabled || isUploading,
    noClick: multiple ? false : hasActiveFile,
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
    onFilesChange?.([]);
  };

  const handleRemoveFile = useCallback(
    (indexToRemove) => {
      const fileToRemove = currentFiles[indexToRemove];
      const nextPreviews = new Map(previewMap);
      if (fileToRemove) {
        const url = nextPreviews.get(fileToRemove);
        if (url) {
          revokeUrl(url);
          nextPreviews.delete(fileToRemove);
        }
      }
      setPreviewMap(nextPreviews);

      const updatedFiles = currentFiles.filter(
        (_, idx) => idx !== indexToRemove
      );
      setErrorMessage(null);

      if (!isControlled) {
        setInternalFiles(updatedFiles);
      }

      const enrichedItems = updatedFiles.map((file, idx) => ({
        id: `${file.name}-${file.size}-${file.lastModified || idx}`,
        file,
        preview: nextPreviews.get(file) || null,
        name: file.name,
        size: file.size,
        type: file.type,
      }));

      onChange?.(updatedFiles);
      onFileSelect?.(updatedFiles);
      onFilesChange?.(enrichedItems);
    },
    [
      currentFiles,
      isControlled,
      onChange,
      onFileSelect,
      onFilesChange,
      previewMap,
      revokeUrl,
    ]
  );

  const handleClearAll = useCallback(() => {
    previewMap.forEach((url) => {
      revokeUrl(url);
    });
    setPreviewMap(new Map());
    setErrorMessage(null);

    if (!isControlled) {
      setInternalFiles([]);
    }
    onChange?.([]);
    onFileSelect?.([]);
    onFilesChange?.([]);
  }, [
    isControlled,
    onChange,
    onFileSelect,
    onFilesChange,
    previewMap,
    revokeUrl,
  ]);

  const computedHint =
    hint ||
    (maxSize
      ? `Até ${formatFileSize(maxSize)} por arquivo`
      : totalSizeLimit
        ? `Até ${formatFileSize(totalSizeLimit)} no total`
        : null);

  const computedFoldedDescription =
    foldedDescription ||
    (totalSizeLimit
      ? `Qualquer tipo, até ${formatFileSize(totalSizeLimit)} no total`
      : 'Qualquer tipo de arquivo');

  const totalBytes = useMemo(() => {
    if (!multiple || !currentFiles.length) return 0;
    return currentFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  }, [multiple, currentFiles]);

  const activeFile =
    currentFile ||
    (initialPreviewUrl
      ? { name: previewAlt, size: 0, type: 'image/jpeg' }
      : null);

  const activePreviewUrl = objectUrl || initialPreviewUrl;

  return (
    <DropzoneRoot className={className} {...props}>
      <input {...getInputProps()} />

      {multiple ? (
        hasFiles ? (
          <div className="space-y-3">
            <DropzoneFoldedStrip
              {...getRootProps()}
              title={foldedTitle}
              description={computedFoldedDescription}
              onAddMore={(e) => {
                e?.stopPropagation?.();
                open();
              }}
              isDragActive={isDragActive}
              isDragReject={isDragReject}
              isDragAccept={isDragAccept}
              disabled={disabled || isUploading}
              isUploading={isUploading}
            />
            <DropzoneFileList
              title={folderTitle}
              count={currentFiles.length}
              totalBytes={totalBytes}
              totalSizeLimit={totalSizeLimit}
              onClearAll={handleClearAll}
              showClearAll={showClearAll}
              disabled={disabled || isUploading}
            >
              {currentFiles.map((file, index) => (
                <DropzoneFileItem
                  key={`${file.name}-${file.size}-${file.lastModified || index}`}
                  file={file}
                  previewUrl={previewMap.get(file)}
                  onRemove={() => handleRemoveFile(index)}
                  disabled={disabled || isUploading}
                  isUploading={isUploading}
                />
              ))}
            </DropzoneFileList>
          </div>
        ) : (
          <DropzoneZone
            {...getRootProps()}
            isDragActive={isDragActive}
            isDragReject={isDragReject}
            isDragAccept={isDragAccept}
            disabled={disabled || isUploading}
          >
            <DropzoneEmptyState
              title={title || 'Arraste e solte seus arquivos aqui'}
              description={description}
              hint={computedHint}
              isDragActive={isDragActive}
              isDragReject={isDragReject}
              isUploading={isUploading}
            />
          </DropzoneZone>
        )
      ) : hasActiveFile && activeFile ? (
        <DropzoneSinglePreview
          file={activeFile}
          previewUrl={activePreviewUrl}
          onReplace={handleReplace}
          onRemove={handleRemove}
          disabled={disabled || isUploading}
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
            title={title || 'Arraste e solte seu arquivo aqui'}
            description={description}
            hint={computedHint}
            isDragActive={isDragActive}
            isDragReject={isDragReject}
            isUploading={isUploading}
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