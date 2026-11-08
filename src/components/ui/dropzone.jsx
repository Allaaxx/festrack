import {
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  UploadCloudIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

function DropzoneFoldedStrip({
  title = 'Arraste mais arquivos aqui',
  description,
  onAddMore,
  disabled = false,
  isDragActive = false,
  isDragReject = false,
  isDragAccept = false,
  buttonLabel = 'Adicionar mais',
  icon: Icon = UploadIcon,
  className,
  children,
  ...props
}) {
  return (
    <div
      data-slot="dropzone-folded-strip"
      data-drag-active={isDragActive ? '' : undefined}
      data-drag-reject={isDragReject ? '' : undefined}
      data-drag-accept={isDragAccept ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      className={cn(
        'group/folded relative flex items-center justify-between gap-4 rounded-xl border border-dashed border-border bg-card/40 p-3.5 transition-colors cursor-pointer',
        'hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDragActive && 'border-primary bg-primary/5 scale-[0.99]',
        isDragReject && 'border-destructive bg-destructive/5',
        disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-colors group-hover/folded:bg-primary/10 group-hover/folded:text-primary',
            isDragActive && 'bg-primary/10 text-primary',
            isDragReject && 'bg-destructive/10 text-destructive'
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {isDragReject
              ? 'Formato de arquivo não suportado'
              : isDragActive
                ? 'Solte para adicionar os arquivos'
                : title}
          </p>
          {description && (
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddMore}
          disabled={disabled}
        >
          {buttonLabel}
        </Button>
      </div>
      {children}
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

function DropzoneFileItem({
  file,
  previewUrl,
  onRemove,
  disabled = false,
  removeLabel = 'Remover arquivo',
  className,
  ...props
}) {
  const category = getFileCategory(file);
  const isImage =
    (category === 'image' || file?.type?.startsWith('image/')) && !!previewUrl;

  return (
    <div
      data-slot="dropzone-file-item"
      className={cn(
        'group/item flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30',
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted/50 flex items-center justify-center">
          {isImage ? (
            <img
              src={previewUrl}
              alt={file?.name || 'Prévia do arquivo'}
              className="h-full w-full object-cover"
            />
          ) : (
            <DropzoneFileGlyph category={category} className="size-5" />
          )}
        </div>
        <div className="min-w-0">
          <p
            className="truncate text-sm font-medium text-foreground"
            title={file?.name}
          >
            {file?.name || 'Arquivo'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file?.size)}
          </p>
        </div>
      </div>

      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onRemove}
          disabled={disabled}
          aria-label={file?.name ? `Remover ${file.name}` : removeLabel}
        >
          <XIcon className="size-4" />
        </Button>
      )}
    </div>
  );
}

function DropzoneFileList({
  title = 'Na pasta',
  count = 0,
  totalBytes = 0,
  totalSizeLimit,
  onClearAll,
  clearAllLabel = 'Limpar tudo',
  showClearAll = true,
  disabled = false,
  children,
  className,
  ...props
}) {
  const countLabel =
    count === 1 ? '1 arquivo' : `${count} arquivos`;

  const summaryLabel = totalSizeLimit
    ? `${countLabel}, ${formatFileSize(totalBytes)} de ${formatFileSize(totalSizeLimit)}`
    : `${countLabel}, ${formatFileSize(totalBytes)}`;

  const progressValue =
    totalSizeLimit && totalSizeLimit > 0
      ? Math.min(100, Math.round((totalBytes / totalSizeLimit) * 100))
      : 0;

  return (
    <div
      data-slot="dropzone-file-list"
      className={cn(
        'overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <span className="text-xs text-muted-foreground">{countLabel}</span>
      </div>

      <div className="divide-y divide-border/50 max-h-72 overflow-y-auto">
        {children}
      </div>

      {count > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-border/50 bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {summaryLabel}
            </span>
            {showClearAll && onClearAll && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearAll}
                disabled={disabled}
              >
                {clearAllLabel}
              </Button>
            )}
          </div>
          {Boolean(totalSizeLimit) && (
            <Progress value={progressValue} className="h-1.5" />
          )}
        </div>
      )}
    </div>
  );
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
  DropzoneFileItem,
  DropzoneFileList,
  DropzoneFoldedStrip,
  DropzoneRoot,
  DropzoneSinglePreview,
  DropzoneZone,
};
