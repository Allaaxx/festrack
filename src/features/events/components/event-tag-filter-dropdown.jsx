import { ChevronDownIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const DEFAULT_EVENT_TAGS = [
  { value: 'family', label: 'Família', dotClass: 'bg-amber-400' },
  { value: 'business', label: 'Negócios', dotClass: 'bg-violet-400' },
  { value: 'personal', label: 'Pessoal', dotClass: 'bg-rose-400' },
  { value: 'holiday', label: 'Feriado', dotClass: 'bg-emerald-400' },
  { value: 'etc', label: 'Outros', dotClass: 'bg-sky-400' },
];

export const SYSTEM_TAG_VALUES = [
  'family',
  'business',
  'personal',
  'holiday',
  'etc',
];

export function EventTagFilterDropdown({
  showAllTags,
  selectedTags,
  tagOptions,
  onSetShowAllTags,
  onToggleTagFilter,
  onAddTagOption,
  onRemoveTagOption,
  // Backward-compatibility aliases
  showAllTypes,
  selectedTypes,
  eventTypeOptions,
  onSetShowAllTypes,
  onToggleTypeFilter,
  onAddEventTypeOption,
  onRemoveEventTypeOption,
}) {
  const isShowAll = showAllTags ?? showAllTypes ?? true;
  const currentSelectedTags = selectedTags ?? selectedTypes ?? [];
  const currentTagOptions =
    tagOptions ?? eventTypeOptions ?? DEFAULT_EVENT_TAGS;
  const handleSetShowAll = onSetShowAllTags ?? onSetShowAllTypes;
  const handleToggle = onToggleTagFilter ?? onToggleTypeFilter;
  const handleAdd = onAddTagOption ?? onAddEventTypeOption;
  const handleRemove = onRemoveTagOption ?? onRemoveEventTypeOption;

  const [newFilterName, setNewFilterName] = useState('');

  const handleAddFilter = () => {
    const trimmed = newFilterName.trim();
    if (!trimmed) return;
    handleAdd?.(trimmed);
    setNewFilterName('');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-9 shrink-0 gap-1 px-2"
            aria-label="Filtro de etiquetas"
          >
            <span className="flex items-center -space-x-1.5">
              <span className="ring-background size-2.5 rounded-full bg-amber-400 ring-2" />
              <span className="ring-background size-2.5 rounded-full bg-violet-400 ring-2" />
              <span className="ring-background size-2.5 rounded-full bg-sky-400 ring-2" />
            </span>
            <ChevronDownIcon className="ml-0.5 size-3.5 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-64 p-1">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filtro de etiquetas</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Todas Checkbox */}
          <DropdownMenuCheckboxItem
            checked={isShowAll}
            onCheckedChange={(checked) => handleSetShowAll?.(Boolean(checked))}
          >
            Todas
          </DropdownMenuCheckboxItem>

          {/* Each Event Tag */}
          {currentTagOptions.map((opt) => {
            const isChecked =
              isShowAll || currentSelectedTags.includes(opt.value);
            const isSystemTag =
              opt.isSystem ?? SYSTEM_TAG_VALUES.includes(opt.value);

            return (
              <div
                key={opt.value}
                className="group/item hover:bg-accent/40 flex items-center justify-between rounded-md pr-1"
              >
                <DropdownMenuCheckboxItem
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleToggle?.(opt.value, Boolean(checked))
                  }
                  className="flex-1 pr-2"
                >
                  <span
                    className={cn('size-2 shrink-0 rounded-full', opt.dotClass)}
                  />
                  <span className="truncate">{opt.label}</span>
                </DropdownMenuCheckboxItem>
                {/* Trash icon to remove custom tags - separated from checkbox to prevent overlap */}
                {!isSystemTag && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove?.(opt.value, opt.id);
                    }}
                    className="text-muted-foreground hover:text-destructive hover:bg-accent flex size-6 shrink-0 items-center justify-center rounded-sm opacity-0 transition-opacity group-hover/item:opacity-100"
                    title={`Remover etiqueta ${opt.label}`}
                    aria-label={`Remover etiqueta ${opt.label}`}
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Add New Filter Input */}
        <div
          className="flex items-center gap-1 p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFilter();
              }
            }}
            placeholder="Nova etiqueta..."
            className="h-8 text-xs"
          />
          <Button
            size="icon-xs"
            variant="outline"
            className="size-8 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleAddFilter();
            }}
            disabled={!newFilterName.trim()}
            aria-label="Adicionar etiqueta"
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default EventTagFilterDropdown;
