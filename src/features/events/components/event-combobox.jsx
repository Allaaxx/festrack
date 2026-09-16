import { ChevronsUpDownIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGetEvents } from '@/features/events/api/hooks';
import { cn } from '@/lib/utils';

/**
 * Combobox para seleção de evento.
 * @param {{
 *   id?: string,
 *   value?: string | null,
 *   onChange: (value: string | null) => void,
 *   disabled?: boolean,
 *   'aria-invalid'?: boolean,
 * }} props
 */
const EventCombobox = ({
  id,
  value,
  onChange,
  disabled,
  'aria-invalid': ariaInvalid,
}) => {
  const [open, setOpen] = useState(false);
  const { data: events = [], isLoading } = useGetEvents();

  const selectedEvent = events.find((event) => event.id === value) ?? null;

  const handleSelect = (eventId) => {
    onChange(value === eventId ? null : eventId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            className="w-full justify-between font-normal"
          >
            {isLoading ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <span
                className={cn(
                  'truncate',
                  !selectedEvent && 'text-muted-foreground'
                )}
              >
                {selectedEvent ? selectedEvent.name : 'Selecione um evento'}
              </span>
            )}
            <ChevronsUpDownIcon className="ml-2 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) p-0">
        <Command>
          <CommandInput placeholder="Buscar evento..." />
          <CommandList>
            <CommandEmpty>Nenhum evento encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="sem evento nenhum limpar"
                data-checked={!value}
                onSelect={() => handleSelect(null)}
              >
                <span className="text-muted-foreground">Sem evento</span>
              </CommandItem>
              {events.map((event) => (
                <CommandItem
                  key={event.id}
                  value={`${event.name} ${event.id}`}
                  data-checked={value === event.id}
                  onSelect={() => handleSelect(event.id)}
                >
                  <span className="truncate">{event.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default EventCombobox;
