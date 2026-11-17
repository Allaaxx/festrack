import { useCallback, useMemo, useState } from 'react';

import { useShopContext } from '@/contexts/shop';
import {
  useCreateEventTag,
  useDeleteEventTag,
  useGetEventTags,
} from '@/features/events/api/hooks';
import {
  DEFAULT_EVENT_TAGS,
  SYSTEM_TAG_VALUES,
  TAG_COLOR_PALETTE,
} from '@/features/events/constants';

const EMPTY_EVENTS = [];

function readStoredTags(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
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
 * Deep hook for Event Tag lifecycle management, storage persistence, and calendar event filtering.
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

  const tagsStorageKey = shopId
    ? `festrack:${shopId}:event_tags`
    : 'festrack:event_tags';
  const filtersStorageKey = shopId
    ? `festrack:${shopId}:event_tag_filters`
    : 'festrack:event_tag_filters';

  const [prevStorageKey, setPrevStorageKey] = useState(tagsStorageKey);
  const [customTagOptions, setCustomTagOptions] = useState(() =>
    readStoredTags(tagsStorageKey)
  );

  const [filterState, setFilterState] = useState(() =>
    readStoredFilters(filtersStorageKey)
  );

  // Synchronize state during render when shop/storage key changes
  if (prevStorageKey !== tagsStorageKey) {
    setPrevStorageKey(tagsStorageKey);
    setCustomTagOptions(readStoredTags(tagsStorageKey));
    setFilterState(readStoredFilters(filtersStorageKey));
  }

  const persistTags = useCallback(
    (tags) => {
      try {
        localStorage.setItem(tagsStorageKey, JSON.stringify(tags));
      } catch (err) {
        void err;
      }
    },
    [tagsStorageKey]
  );

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
    if (serverTags && serverTags.length > 0) {
      return serverTags.map((t) => ({
        id: t.id,
        value: t.slug || t.value,
        label: t.name || t.label,
        dotClass: t.color || t.dotClass,
        isSystem: t.is_system ?? t.isSystem,
      }));
    }
    return [...DEFAULT_EVENT_TAGS, ...customTagOptions];
  }, [serverTags, customTagOptions]);

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
    (name) => {
      if (typeof name !== 'string') return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const value = trimmed.toLowerCase().replace(/\s+/g, '-');
      if (
        allTagOptions.some(
          (opt) =>
            opt.value.toLowerCase() === value.toLowerCase() ||
            (opt.label && opt.label.toLowerCase() === trimmed.toLowerCase())
        )
      ) {
        return;
      }

      const color =
        TAG_COLOR_PALETTE[customTagOptions.length % TAG_COLOR_PALETTE.length];
      const newOption = { value, label: trimmed, dotClass: color };

      setCustomTagOptions((prev) => {
        const next = [...prev, newOption];
        persistTags(next);
        return next;
      });

      createTagMutation?.mutate?.({
        name: trimmed,
        color,
        slug: value,
        ...(shopId ? { shopId } : {}),
      });
    },
    [
      allTagOptions,
      customTagOptions.length,
      persistTags,
      createTagMutation,
      shopId,
    ]
  );

  const handleRemoveTagOption = useCallback(
    (value, id) => {
      const targetTag = allTagOptions.find(
        (opt) => opt.value === value || (id && opt.id === id)
      );
      const isSystem =
        Boolean(targetTag?.isSystem) || SYSTEM_TAG_VALUES.includes(value);

      if (isSystem) {
        return;
      }

      setCustomTagOptions((prev) => {
        const next = prev.filter(
          (opt) => opt.value !== value && (!id || opt.id !== id)
        );
        persistTags(next);
        return next;
      });

      setFilterState((prev) => {
        const nextSelected = prev.selectedTags.filter((v) => v !== value);
        const remainingOptions = allTagOptions.filter(
          (opt) => opt.value !== value && (!id || opt.id !== id)
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
    [allTagOptions, persistTags, persistFilters, deleteTagMutation, shopId]
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
        event?.color ||
        'etc';
      return selectedTags.includes(eventTag);
    });
  }, [events, showAllTags, selectedTags]);

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
