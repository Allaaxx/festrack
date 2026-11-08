import {
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  UploadCloudIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatFileSize, getFileCategory } from '@/helpers/file';
import { cn } from '@/lib/utils';

function DropzoneRoot({ className, children, ...props }) {
  return (
    <div
      data-slot="dropzone-root"
      className={cn('relative w-full space-y-2', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function DropzoneZone({
  className,
  isDragActive = false,
  isDragReject = false,
  isDragAccept = false,
  disabled = false,
  children,
  ...props
}) {
  return (
    <div
      data-slot="dropzone-zone"
      data-drag-active={isDragActive ? '' : undefined}
      data-drag-reject={isDragReject ? '' : undefined}
      data-drag-accept={isDragAccept ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      className={cn(
        'group/dropzone relative flex min-h-[180px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/40 p-8 text-center transition-all cursor-pointer',
        'hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDragActive && 'border-primary bg-primary/5 scale-[0.99]',
        isDragReject && 'border-destructive bg-destructive/5',
        disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DropzoneEmptyState({
  title = 'Arraste e solte seu arquivo aqui',
  description = 'ou clique para navegar no computador',
  hint,
  isDragActive = false,
  isDragReject = false,
  icon: Icon = UploadCloudIcon,
  className,
  ...props
}) {
  return (
    <div
      data-slot="dropzone-empty-state"
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      {...props}
    >
      <div
        className={cn(
          'flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover/dropzone:bg-primary/10 group-hover/dropzone:text-primary',
          isDragActive && 'bg-primary/10 text-primary',
          isDragReject && 'bg-destructive/10 text-destructive'
        )}
      >
        <Icon className="size-6" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {isDragReject
            ? 'Formato de arquivo não suportado'
            : isDragActive
              ? 'Solte para selecionar o arquivo'
              : title}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {hint && (
        <p className="text-xs text-muted-foreground/80">{hint}</p>
      )}
    </div>
  );
}

function DropzoneFileGlyph({ category, className }) {
  switch (category) {
    case 'image':
      return <ImageIcon className={cn('size-6 text-muted-foreground', className)} />;
    case 'pdf':
      return <FileTextIcon className={cn('size-6 text-muted-foreground', className)} />;
    case 'spreadsheet':
      return (
        <FileSpreadsheetIcon className={cn('size-6 text-muted-foreground', className)} />
      );
    case 'document':
      return <FileTextIcon className={cn('size-6 text-muted-foreground', className)} />;
    case 'archive':
      return <FileArchiveIcon className={cn('size-6 text-muted-foreground', className)} />;
    default:
      return <FileIcon className={cn('size-6 text-muted-foreground', className)} />;
  }
}

function DropzoneSinglePreview({
  file,
  previewUrl,
  onReplace,
  onRemove,
  disabled = false,
  isUploading = false,
  replaceLabel = 'Substituir',
  removeLabel = 'Remover',
  className,
  ...props
}) {
  const category = getFileCategory(file);
  const isImage = (category === 'image' || file?.type?.startsWith('image/')) && !!previewUrl;

  return (
    <div
      data-slot="dropzone-single-preview"
      className={cn(
        'relative flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs transition-all',
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/50 flex items-center justify-center">
          {isImage ? (
            <img
              src={previewUrl}
              alt={file?.name || 'Prévia do arquivo'}
              className="h-full w-full object-cover"
            />
          ) : (
            <DropzoneFileGlyph category={category} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {file?.name || 'Arquivo selecionado'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file?.size)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isUploading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            <span>Enviando...</span>
          </div>
        ) : (
          <>
            {onReplace && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReplace}
                disabled={disabled}
              >
                {replaceLabel}
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                disabled={disabled}
                aria-label={removeLabel}
              >
                {removeLabel}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export {
  DropzoneEmptyState,
  DropzoneFileGlyph,
  DropzoneRoot,
  DropzoneSinglePreview,
  DropzoneZone,
};
