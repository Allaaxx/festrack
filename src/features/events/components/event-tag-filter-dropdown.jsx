import { ChevronDownIcon } from 'lucide-react';

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

import { TagPicker } from './tag-picker';

/**
 * Filtro de etiquetas da barra lateral.
 * Wrapper fino com multi-seleção e opção "Todas" sobre o TagPicker base.
 */
export function EventTagFilterDropdown({
  tagFilter,
  showAllTags,
  selectedTags,
  tagOptions,
  onSetShowAllTags,
  onToggleTagFilter,
  onAddTagOption,
  onRemoveTagOption,
  setShowAllTags,
  setShowAll,
  toggleTagFilter,
  toggleTag,
  addTagOption,
  addTag,
  removeTagOption,
  removeTag,
}) {
  const isShowAll = tagFilter?.showAllTags ?? showAllTags ?? true;

  const currentSelectedTags = tagFilter?.selectedTags ?? selectedTags ?? [];

  const currentTagOptions = tagFilter?.tagOptions ?? tagOptions ?? [];

  const handleSetShowAll =
    tagFilter?.onSetShowAllTags ||
    tagFilter?.setShowAllTags ||
    tagFilter?.setShowAll ||
    onSetShowAllTags ||
    setShowAllTags ||
    setShowAll;

  const handleToggle =
    tagFilter?.onToggleTagFilter ||
    tagFilter?.toggleTagFilter ||
    tagFilter?.toggleTag ||
    onToggleTagFilter ||
    toggleTagFilter ||
    toggleTag;

  const handleAdd =
    tagFilter?.onAddTagOption ||
    tagFilter?.addTagOption ||
    tagFilter?.addTag ||
    onAddTagOption ||
    addTagOption ||
    addTag;

  const handleRemove =
    tagFilter?.onRemoveTagOption ||
    tagFilter?.removeTagOption ||
    tagFilter?.removeTag ||
    onRemoveTagOption ||
    removeTagOption ||
    removeTag;

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

          {/* Opção Todas */}
          <DropdownMenuCheckboxItem
            checked={isShowAll}
            onCheckedChange={(checked) => handleSetShowAll?.(Boolean(checked))}
          >
            Todas
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>

        {/* Componente base de etiquetas */}
        <TagPicker
          tagOptions={currentTagOptions}
          isSelected={(opt) =>
            isShowAll || currentSelectedTags.includes(opt.value)
          }
          onToggleTag={(val, nextChecked) => handleToggle?.(val, nextChecked)}
          onAddTag={handleAdd}
          onRemoveTag={handleRemove}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default EventTagFilterDropdown;
