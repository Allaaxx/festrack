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
  showAllTypes = true,
  selectedTypes = [],
  eventTypeOptions = DEFAULT_EVENT_TAGS,
  onSetShowAllTypes,
  onToggleTypeFilter,
  onAddEventTypeOption,
  onRemoveEventTypeOption,
}) {
  const [newFilterName, setNewFilterName] = useState('');

  const handleAddFilter = () => {
    const trimmed = newFilterName.trim();
    if (!trimmed) return;
    onAddEventTypeOption?.(trimmed);
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
      <DropdownMenuContent align="start" className="w-56 p-1">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filtro de etiquetas</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Todas Checkbox */}
          <DropdownMenuCheckboxItem
            checked={showAllTypes}
            onCheckedChange={(checked) => onSetShowAllTypes?.(Boolean(checked))}
          >
            Todas
          </DropdownMenuCheckboxItem>

          {/* Each Event Type */}
          {eventTypeOptions.map((opt) => {
            const isChecked = showAllTypes || selectedTypes.includes(opt.value);
            const isSystemTag = SYSTEM_TAG_VALUES.includes(opt.value);

            return (
              <div
                key={opt.value}
                className="group/item relative flex items-center justify-between"
              >
                <DropdownMenuCheckboxItem
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    onToggleTypeFilter?.(opt.value, Boolean(checked))
                  }
                  className="flex-1 pr-8"
                >
                  <span
                    className={cn('size-2 shrink-0 rounded-full', opt.dotClass)}
                  />
                  <span className="truncate">{opt.label}</span>
                </DropdownMenuCheckboxItem>
                {/* Trash icon to remove custom types */}
                {!isSystemTag && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveEventTypeOption?.(opt.value);
                    }}
                    className="text-muted-foreground hover:text-destructive absolute right-2 p-1 opacity-0 transition-opacity group-hover/item:opacity-100"
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
