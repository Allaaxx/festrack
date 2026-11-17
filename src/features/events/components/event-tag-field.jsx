import { ChevronDownIcon, TagIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { useEventTagFilter } from '../hooks/use-event-tag-filter';
import TagPicker from './tag-picker';

const NO_TAG_LABEL = 'Sem etiqueta';

const toSlug = (name) => name.trim().toLowerCase().replace(/\s+/g, '-');

/**
 * Seletor de Etiqueta única e opcional para formulários de Evento.
 *
 * @param {{
 *   value: string | null,
 *   onChange: (slug: string | null) => void,
 *   disabled?: boolean,
 * }} props
 */
const EventTagField = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { tagOptions, addTag } = useEventTagFilter({});
  const selectedOption = tagOptions.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label ?? value ?? NO_TAG_LABEL;

  const handleSelect = (slug) => {
    onChange(slug);
    setIsOpen(false);
  };

  const handleCreate = async (name) => {
    const created = await addTag(name);
    if (!created) return;
    handleSelect(created.slug ?? created.value ?? toSlug(name));
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="flex-1 justify-between"
              aria-label={`Etiqueta: ${selectedLabel}`}
              disabled={disabled}
            />
          }
        >
          <span className="flex items-center gap-2">
            {selectedOption ? (
              <span
                className={cn(
                  'size-2 rounded-full',
                  selectedOption.dotClass || 'bg-muted-foreground'
                )}
              />
            ) : (
              <TagIcon className="text-muted-foreground" />
            )}
            <span className={cn(!value && 'text-muted-foreground')}>
              {selectedLabel}
            </span>
          </span>
          <ChevronDownIcon className="text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1" align="start">
          <TagPicker
            tagOptions={tagOptions}
            itemRole="option"
            listClassName="max-h-56 overflow-y-auto"
            isSelected={(opt) => opt.value === value}
            onSelectTag={handleSelect}
            onAddTag={handleCreate}
            canDeleteTag={() => false}
            emptyMessage="Nenhuma etiqueta cadastrada"
            addAriaLabel="Criar etiqueta"
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Limpar etiqueta"
          disabled={disabled}
          onClick={() => onChange(null)}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
};

export default EventTagField;
