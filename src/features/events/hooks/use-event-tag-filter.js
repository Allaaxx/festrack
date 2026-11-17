import { useCallback, useMemo, useState } from 'react';

import { toast } from '@/components/ui/toast';
import { useShopContext } from '@/contexts/shop';
import {
  useCreateEventTag,
  useDeleteEventTag,
  useGetEventTags,
} from '@/features/events/api/hooks';
import { TAG_COLOR_PALETTE } from '@/features/events/constants';

const EMPTY_EVENTS = [];

/**
 * Picks the first free color from TAG_COLOR_PALETTE not currently used by existing tags.
 * If all colors are in use, repeats from the beginning of the palette.
 *
 * @param {Array<Object>} existingTags Array of tag option objects
 * @returns {string} Tailwind background color class
 */
export function getNextTagColor(existingTags = []) {
  const usedColors = new Set(
    existingTags.map((opt) => opt.dotClass || opt.color).filter(Boolean)
  );
  const freeColor = TAG_COLOR_PALETTE.find((color) => !usedColors.has(color));
  if (freeColor) {
    return freeColor;
  }
  return TAG_COLOR_PALETTE[existingTags.length % TAG_COLOR_PALETTE.length];
}

function readStoredFilters(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        showAllTags: parsed.showAllTags ?? true,
        selectedTags: Array.isArray(parsed.selectedTags)
          ? parsed.selectedTags
          : [],
      };
    }
  } catch {
    // Fallback to default state when storage read fails
  }
  return { showAllTags: true, selectedTags: [] };
}

/**
 * Deep hook for Event Tag lifecycle management, server-driven tags, and calendar event filtering.
 *
 * @param {Array<Object>|Object} [eventsOrOptions=[]] List of calendar events or an options bag.
 * @param {Object} [maybeOptions={}] Additional options such as explicit shopId.
 * @returns {Object} Cohesive tag filter state, actions, and filtered events.
 */
export function useEventTagFilter(eventsOrOptions = [], maybeOptions = {}) {
  const isEventsArray = Array.isArray(eventsOrOptions);
  const events = isEventsArray
    ? eventsOrOptions
    : eventsOrOptions?.events || EMPTY_EVENTS;
  const options = isEventsArray
    ? maybeOptions || {}
    : eventsOrOptions && typeof eventsOrOptions === 'object'
      ? eventsOrOptions
      : maybeOptions || {};

  const shopContext = useShopContext?.();
  const shopId =
    options.shopId !== undefined ? options.shopId : shopContext?.activeShop?.id;

  const filtersStorageKey = shopId
    ? `festrack:${shopId}:event_tag_filters`
    : 'festrack:event_tag_filters';

  const [prevFiltersStorageKey, setPrevFiltersStorageKey] =
    useState(filtersStorageKey);
  const [filterState, setFilterState] = useState(() =>
    readStoredFilters(filtersStorageKey)
  );

  // Synchronize state during render when shop/storage key changes
  if (prevFiltersStorageKey !== filtersStorageKey) {
    setPrevFiltersStorageKey(filtersStorageKey);
    setFilterState(readStoredFilters(filtersStorageKey));
  }

  const persistFilters = useCallback(
    (filters) => {
      try {
        localStorage.setItem(filtersStorageKey, JSON.stringify(filters));
      } catch (err) {
        void err;
      }
    },
    [filtersStorageKey]
  );

  const { data: serverTags } = useGetEventTags();
  const createTagMutation = useCreateEventTag();
  const deleteTagMutation = useDeleteEventTag();

  const allTagOptions = useMemo(() => {
    const rawTags = options.serverTags || options.tagOptions || serverTags;
    if (Array.isArray(rawTags) && rawTags.length > 0) {
      return rawTags.map((t) => ({
        id: t.id,
        value: t.slug || t.value,
        label: t.name || t.label,
        dotClass: t.color || t.dotClass,
      }));
    }
    return [];
  }, [options.serverTags, options.tagOptions, serverTags]);

  const showAllTags = filterState.showAllTags;
  const selectedTags = filterState.selectedTags;

  const handleSetShowAllTags = useCallback(
    (showAll) => {
      const next = {
        showAllTags: Boolean(showAll),
        selectedTags: showAll ? [] : allTagOptions.map((opt) => opt.value),
      };
      setFilterState(next);
      persistFilters(next);
    },
    [allTagOptions, persistFilters]
  );

  const handleToggleTagFilter = useCallback(
    (value, checked) => {
      setFilterState((prev) => {
        let nextSelected;
        let nextShowAll;

        if (prev.showAllTags) {
          if (!checked) {
            nextSelected = allTagOptions
              .map((opt) => opt.value)
              .filter((v) => v !== value);
            nextShowAll = false;
          } else {
            return prev;
          }
        } else {
          if (checked) {
            nextSelected = prev.selectedTags.includes(value)
              ? prev.selectedTags
              : [...prev.selectedTags, value];
          } else {
            nextSelected = prev.selectedTags.filter((v) => v !== value);
          }

          if (
            nextSelected.length === 0 ||
            nextSelected.length === allTagOptions.length
          ) {
            nextShowAll = true;
            nextSelected = [];
          } else {
            nextShowAll = false;
          }
        }

        const next = { showAllTags: nextShowAll, selectedTags: nextSelected };
        persistFilters(next);
        return next;
      });
    },
    [allTagOptions, persistFilters]
  );

  const handleAddTagOption = useCallback(
    async (name) => {
      if (typeof name !== 'string') return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const value = trimmed.toLowerCase().replace(/\s+/g, '-');
      if (
        allTagOptions.some(
          (opt) =>
            opt.value?.toLowerCase() === value.toLowerCase() ||
            (opt.label && opt.label.toLowerCase() === trimmed.toLowerCase())
        )
      ) {
        return;
      }

      const color = getNextTagColor(allTagOptions);

      try {
        let result;
        if (typeof createTagMutation?.mutateAsync === 'function') {
          result = await createTagMutation.mutateAsync({
            name: trimmed,
            color,
            slug: value,
            ...(shopId ? { shopId } : {}),
          });
        } else if (typeof createTagMutation?.mutate === 'function') {
          result = await new Promise((resolve, reject) => {
            createTagMutation.mutate(
              {
                name: trimmed,
                color,
                slug: value,
                ...(shopId ? { shopId } : {}),
              },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          });
        }
        return result;
      } catch (err) {
        void err;
        toast.add({
          type: 'error',
          title: 'Erro ao criar etiqueta',
          description: 'Não foi possível criar a etiqueta. Tente novamente.',
        });
      }
    },
    [allTagOptions, createTagMutation, shopId]
  );

  const handleRemoveTagOption = useCallback(
    (value, id) => {
      const targetTag = allTagOptions.find(
        (opt) => opt.value === value || (id && opt.id === id)
      );

      setFilterState((prev) => {
        const tagValue = targetTag?.value || value;
        const nextSelected = prev.selectedTags.filter((v) => v !== tagValue);
        const remainingOptions = allTagOptions.filter(
          (opt) => opt.value !== tagValue && (!id || opt.id !== id)
        );
        const shouldResetShowAll =
          nextSelected.length === 0 ||
          (remainingOptions.length > 0 &&
            nextSelected.length === remainingOptions.length);

        const next = {
          showAllTags: shouldResetShowAll ? true : prev.showAllTags,
          selectedTags: shouldResetShowAll ? [] : nextSelected,
        };
        persistFilters(next);
        return next;
      });

      const targetId = id || targetTag?.id;
      if (targetId) {
        deleteTagMutation?.mutate?.({
          tagId: targetId,
          ...(shopId ? { shopId } : {}),
        });
      }
    },
    [allTagOptions, persistFilters, deleteTagMutation, shopId]
  );

  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    if (showAllTags || selectedTags.length === 0) return events;
    return events.filter((event) => {
      const eventTag =
        event?.tag ||
        event?.rawEvent?.tag ||
        event?.rawEvent?.category ||
        event?.event ||
        null;
      if (!eventTag) return false;
      const isValidTag = allTagOptions.some(
        (opt) => (opt.value || opt.slug || opt.id) === eventTag
      );
      if (!isValidTag) return false;
      return selectedTags.includes(eventTag);
    });
  }, [events, showAllTags, selectedTags, allTagOptions]);

  const tagFilter = useMemo(
    () => ({
      showAllTags,
      selectedTags,
      tagOptions: allTagOptions,
      // Concise action names (Spec #135)
      setShowAll: handleSetShowAllTags,
      toggleTag: handleToggleTagFilter,
      addTag: handleAddTagOption,
      removeTag: handleRemoveTagOption,
      // Verbose action names
      setShowAllTags: handleSetShowAllTags,
      toggleTagFilter: handleToggleTagFilter,
      addTagOption: handleAddTagOption,
      removeTagOption: handleRemoveTagOption,
      // on* action names
      onSetShowAllTags: handleSetShowAllTags,
      onToggleTagFilter: handleToggleTagFilter,
      onAddTagOption: handleAddTagOption,
      onRemoveTagOption: handleRemoveTagOption,
    }),
    [
      showAllTags,
      selectedTags,
      allTagOptions,
      handleSetShowAllTags,
      handleToggleTagFilter,
      handleAddTagOption,
      handleRemoveTagOption,
    ]
  );

  return {
    filteredEvents,
    showAllTags,
    selectedTags,
    tagOptions: allTagOptions,
    // Concise action names (Spec #135)
    setShowAll: handleSetShowAllTags,
    toggleTag: handleToggleTagFilter,
    addTag: handleAddTagOption,
    removeTag: handleRemoveTagOption,
    // Verbose action names
    setShowAllTags: handleSetShowAllTags,
    toggleTagFilter: handleToggleTagFilter,
    addTagOption: handleAddTagOption,
    removeTagOption: handleRemoveTagOption,
    // on* action names
    onSetShowAllTags: handleSetShowAllTags,
    onToggleTagFilter: handleToggleTagFilter,
    onAddTagOption: handleAddTagOption,
    onRemoveTagOption: handleRemoveTagOption,
    tagFilter,
  };
}
