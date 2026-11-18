import { useCallback, useMemo, useState } from 'react';

import { findTagOption } from '@/features/events/helpers/event';

import { getNextTagColor, useEventTags } from './use-event-tags';

export { getNextTagColor };

const EMPTY_EVENTS = [];

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

  const {
    shopId,
    tagOptions: allTagOptions,
    addTag: handleAddTagOption,
    removeTag: removeServerTag,
  } = useEventTags({
    shopId: options.shopId,
    serverTags: options.serverTags,
    tagOptions: options.tagOptions,
  });

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
      } catch {
        // Ignore storage write errors (e.g. private mode / quota)
      }
    },
    [filtersStorageKey]
  );

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

  const handleRemoveTagOption = useCallback(
    (value, id) => {
      const tagValue = removeServerTag(value, id);

      setFilterState((prev) => {
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
    },
    [allTagOptions, persistFilters, removeServerTag]
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
      if (!findTagOption(allTagOptions, eventTag)) return false;
      return selectedTags.includes(eventTag);
    });
  }, [events, showAllTags, selectedTags, allTagOptions]);

  const tagFilter = useMemo(
    () => ({
      showAllTags,
      selectedTags,
      tagOptions: allTagOptions,
      setShowAll: handleSetShowAllTags,
      toggleTag: handleToggleTagFilter,
      addTag: handleAddTagOption,
      removeTag: handleRemoveTagOption,
      setShowAllTags: handleSetShowAllTags,
      toggleTagFilter: handleToggleTagFilter,
      addTagOption: handleAddTagOption,
      removeTagOption: handleRemoveTagOption,
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
    setShowAll: handleSetShowAllTags,
    toggleTag: handleToggleTagFilter,
    addTag: handleAddTagOption,
    removeTag: handleRemoveTagOption,
    setShowAllTags: handleSetShowAllTags,
    toggleTagFilter: handleToggleTagFilter,
    addTagOption: handleAddTagOption,
    removeTagOption: handleRemoveTagOption,
    onSetShowAllTags: handleSetShowAllTags,
    onToggleTagFilter: handleToggleTagFilter,
    onAddTagOption: handleAddTagOption,
    onRemoveTagOption: handleRemoveTagOption,
    tagFilter,
  };
}
