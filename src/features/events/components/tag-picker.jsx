import { CheckIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { SYSTEM_TAG_VALUES } from '../constants';

/**
 * Componente base de Etiquetas (lista, criação e exclusão).
 * Desacoplado de lógica de seleção (aceita slots / render props para controles de seleção).
 */
export function TagPicker({
  tagOptions = [],
  isSelected,
  onToggleTag,
  onSelectTag,
  onAddTag,
  onAddTagOption,
  addTagOption,
  addTag,
  onRemoveTag,
  onRemoveTagOption,
  removeTagOption,
  removeTag,
  canDeleteTag,
  header,
  footer,
  renderTrailing,
  renderItem,
  itemRole = 'menuitemcheckbox',
  inputPlaceholder = 'Nova etiqueta...',
  addAriaLabel = 'Adicionar etiqueta',
  className,
  listClassName,
  errorMessage: externalErrorMessage,
  error: externalError,
  emptyMessage,
}) {
  const [newTagName, setNewTagName] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = onAddTag || onAddTagOption || addTagOption || addTag;
  const handleRemove =
    onRemoveTag || onRemoveTagOption || removeTagOption || removeTag;

  const activeError = externalErrorMessage || externalError || localError;

  const handleInputChange = (e) => {
    setNewTagName(e.target.value);
    if (localError) {
      setLocalError('');
    }
  };

  const handleAddSubmit = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed || isSubmitting) return;

    const isDuplicate = tagOptions.some(
      (opt) =>
        (opt.label && opt.label.trim().toLowerCase() === trimmed.toLowerCase()) ||
        (opt.name && opt.name.trim().toLowerCase() === trimmed.toLowerCase()) ||
        (opt.value &&
          opt.value.toLowerCase() ===
            trimmed.toLowerCase().replace(/\s+/g, '-'))
    );

    if (isDuplicate) {
      setLocalError('Esta etiqueta já existe');
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalError('');
      await handleAdd?.(trimmed);
      setNewTagName('');
    } catch (err) {
      setLocalError(err?.message || 'Erro ao criar etiqueta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubmit();
    }
  };

  const isTagDeletable = (opt) => {
    if (typeof canDeleteTag === 'function') {
      return canDeleteTag(opt);
    }
    const isSystem =
      Boolean(opt.isSystem) || SYSTEM_TAG_VALUES.includes(opt.value);
    return !isSystem;
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {header}

      {/* Lista de Etiquetas */}
      <div className={cn('flex flex-col gap-0.5', listClassName)}>
        {tagOptions.length === 0 && emptyMessage && (
          <div className="text-muted-foreground px-2 py-1.5 text-xs">
            {emptyMessage}
          </div>
        )}

        {tagOptions.map((opt) => {
          const isChecked = Boolean(isSelected?.(opt));
          const canDelete = isTagDeletable(opt);
          const label = opt.label || opt.name;

          const handleSelect = () => {
            onToggleTag?.(opt.value, !isChecked, opt);
            onSelectTag?.(opt.value, opt);
          };

          if (typeof renderItem === 'function') {
            return renderItem({
              option: opt,
              isSelected: isChecked,
              canDelete,
              onSelect: handleSelect,
              onRemove: () => handleRemove?.(opt.value, opt.id),
            });
          }

          return (
            <div
              key={opt.value}
              role={itemRole}
              aria-checked={isChecked}
              aria-label={label}
              tabIndex={0}
              onClick={handleSelect}
              onKeyDown={(e) => {
                if (
                  e.target === e.currentTarget &&
                  (e.key === 'Enter' || e.key === ' ')
                ) {
                  e.preventDefault();
                  handleSelect();
                }
              }}
              className="group/item hover:bg-accent/40 focus:bg-accent/40 relative flex cursor-pointer select-none items-center gap-1.5 rounded-md py-1 pr-2 pl-1.5 text-sm outline-hidden transition-colors"
            >
              {/* 1. Bolinha de cor */}
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  opt.dotClass || opt.color
                )}
                aria-hidden="true"
              />

              {/* 2. Nome da Tag (truncate) */}
              <span className="truncate flex-1 text-left">{label}</span>

              {/* 3. Botão Lixeira (à esquerda do indicador de selecionado ✓) */}
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove?.(opt.value, opt.id);
                  }}
                  className="text-muted-foreground hover:text-destructive hover:bg-accent flex size-6 shrink-0 items-center justify-center rounded-sm opacity-0 transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100"
                  title={`Remover etiqueta ${label}`}
                  aria-label={`Remover etiqueta ${label}`}
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              )}

              {/* 4. Indicador de selecionado (✓) */}
              {renderTrailing ? (
                renderTrailing(opt, { isSelected: isChecked })
              ) : (
                <span
                  className="flex size-4 shrink-0 items-center justify-center"
                  data-slot="tag-picker-indicator"
                >
                  {isChecked && <CheckIcon className="size-4" />}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Separator className="my-1" />

      {/* Input de Nova Etiqueta e Botão de Adicionar */}
      <div
        className="flex flex-col gap-1 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          <Input
            value={newTagName}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={inputPlaceholder}
            className="h-8 text-xs"
            aria-invalid={Boolean(activeError)}
            disabled={isSubmitting}
          />
          <Button
            size="icon-xs"
            variant="outline"
            className="size-8 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleAddSubmit();
            }}
            disabled={!newTagName.trim() || isSubmitting}
            aria-label={addAriaLabel}
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
        {activeError && (
          <span className="text-destructive text-xs px-0.5" role="alert">
            {activeError}
          </span>
        )}
      </div>

      {footer}
    </div>
  );
}

export default TagPicker;
