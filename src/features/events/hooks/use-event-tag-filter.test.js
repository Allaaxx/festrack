import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
import { useEventTagFilter } from '@/features/events/hooks/use-event-tag-filter';

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
}));

vi.mock('@/features/events/api/hooks', () => ({
  useGetEventTags: vi.fn(),
  useCreateEventTag: vi.fn(),
  useDeleteEventTag: vi.fn(),
}));

describe('useEventTagFilter - Deep Module (#136)', () => {
  const mockCreateMutate = vi.fn();
  const mockDeleteMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    useShopContext.mockReturnValue({
      activeShop: { id: 'shop-test-1' },
    });

    useGetEventTags.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    useCreateEventTag.mockReturnValue({
      mutate: mockCreateMutate,
    });

    useDeleteEventTag.mockReturnValue({
      mutate: mockDeleteMutate,
    });
  });

  describe('Initialization and Storage Fallback', () => {
    it('initializes with DEFAULT_EVENT_TAGS and empty custom tags when localStorage is empty', () => {
      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.showAllTags).toBe(true);
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.tagOptions).toEqual(DEFAULT_EVENT_TAGS);
      expect(result.current.tagFilter).toBeDefined();
      expect(result.current.tagFilter.showAllTags).toBe(true);
      expect(result.current.tagFilter.selectedTags).toEqual([]);
      expect(result.current.tagFilter.tagOptions).toEqual(DEFAULT_EVENT_TAGS);
    });

    it('loads custom tags and filters from scoped localStorage key for activeShop', () => {
      const storedTags = [
        { value: 'workshop', label: 'Workshop', dotClass: 'bg-indigo-400' },
      ];
      const storedFilters = {
        showAllTags: false,
        selectedTags: ['workshop'],
      };

      localStorage.setItem(
        'festrack:shop-test-1:event_tags',
        JSON.stringify(storedTags)
      );
      localStorage.setItem(
        'festrack:shop-test-1:event_tag_filters',
        JSON.stringify(storedFilters)
      );

      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(['workshop']);
      expect(result.current.tagOptions).toEqual([
        ...DEFAULT_EVENT_TAGS,
        ...storedTags,
      ]);
    });

    it('falls back to unscoped localStorage keys when shopId is undefined', () => {
      useShopContext.mockReturnValue({
        activeShop: null,
      });

      const unscopedTags = [
        { value: 'meetup', label: 'Meetup', dotClass: 'bg-teal-400' },
      ];
      const unscopedFilters = {
        showAllTags: false,
        selectedTags: ['meetup'],
      };

      localStorage.setItem('festrack:event_tags', JSON.stringify(unscopedTags));
      localStorage.setItem(
        'festrack:event_tag_filters',
        JSON.stringify(unscopedFilters)
      );

      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(['meetup']);
      expect(result.current.tagOptions).toEqual([
        ...DEFAULT_EVENT_TAGS,
        ...unscopedTags,
      ]);
    });

    it('handles corrupted localStorage JSON gracefully without throwing', () => {
      localStorage.setItem('festrack:shop-test-1:event_tags', '{invalid-json');
      localStorage.setItem(
        'festrack:shop-test-1:event_tag_filters',
        'not-a-json'
      );

      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.showAllTags).toBe(true);
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.tagOptions).toEqual(DEFAULT_EVENT_TAGS);
    });

    it('supports flexible argument signatures: events array, options object, or both', () => {
      const sampleEvents = [{ id: '1', title: 'Test', tag: 'family' }];

      // Signature 1: useEventTagFilter(events)
      const { result: r1 } = renderHook(() => useEventTagFilter(sampleEvents));
      expect(r1.current.filteredEvents).toEqual(sampleEvents);

      // Signature 2: useEventTagFilter({ events, shopId })
      const { result: r2 } = renderHook(() =>
        useEventTagFilter({ events: sampleEvents, shopId: 'shop-custom' })
      );
      expect(r2.current.filteredEvents).toEqual(sampleEvents);

      // Signature 3: useEventTagFilter(events, { shopId })
      const { result: r3 } = renderHook(() =>
        useEventTagFilter(sampleEvents, { shopId: 'shop-custom' })
      );
      expect(r3.current.filteredEvents).toEqual(sampleEvents);
    });
  });

  describe('Shop Scoping & Reactive Switching', () => {
    it('switches stored tags and filter state when shopId changes', () => {
      localStorage.setItem(
        'festrack:shop-A:event_tags',
        JSON.stringify([
          { value: 'tag-a', label: 'Tag A', dotClass: 'bg-indigo-400' },
        ])
      );
      localStorage.setItem(
        'festrack:shop-B:event_tags',
        JSON.stringify([
          { value: 'tag-b', label: 'Tag B', dotClass: 'bg-teal-400' },
        ])
      );

      const { result, rerender } = renderHook(
        ({ shopId }) => useEventTagFilter([], { shopId }),
        { initialProps: { shopId: 'shop-A' } }
      );

      expect(
        result.current.tagOptions.some((opt) => opt.value === 'tag-a')
      ).toBe(true);
      expect(
        result.current.tagOptions.some((opt) => opt.value === 'tag-b')
      ).toBe(false);

      // Re-render with shop-B
      rerender({ shopId: 'shop-B' });

      expect(
        result.current.tagOptions.some((opt) => opt.value === 'tag-a')
      ).toBe(false);
      expect(
        result.current.tagOptions.some((opt) => opt.value === 'tag-b')
      ).toBe(true);
    });
  });

  describe('Custom Tag Creation & Color Cycling', () => {
    it('creates a custom tag, cycles colors from TAG_COLOR_PALETTE, and invokes API mutation', () => {
      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      act(() => {
        result.current.addTagOption('Congresso');
      });

      // First custom tag should get first color in palette
      const expectedFirstColor = TAG_COLOR_PALETTE[0];
      expect(mockCreateMutate).toHaveBeenCalledWith({
        name: 'Congresso',
        color: expectedFirstColor,
        slug: 'congresso',
        shopId: 'shop-test-1',
      });

      expect(
        result.current.tagOptions.some(
          (opt) =>
            opt.value === 'congresso' &&
            opt.label === 'Congresso' &&
            opt.dotClass === expectedFirstColor
        )
      ).toBe(true);

      // Verify persisted in localStorage
      const stored = JSON.parse(
        localStorage.getItem('festrack:shop-test-1:event_tags')
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].value).toBe('congresso');

      // Add second custom tag - should get second color in palette
      act(() => {
        result.current.addTagOption('Treinamento');
      });

      const expectedSecondColor = TAG_COLOR_PALETTE[1];
      expect(mockCreateMutate).toHaveBeenCalledWith({
        name: 'Treinamento',
        color: expectedSecondColor,
        slug: 'treinamento',
        shopId: 'shop-test-1',
      });

      expect(
        result.current.tagOptions.some(
          (opt) =>
            opt.value === 'treinamento' && opt.dotClass === expectedSecondColor
        )
      ).toBe(true);
    });

    it('wraps around TAG_COLOR_PALETTE when adding more custom tags than palette length', () => {
      const { result } = renderHook(() => useEventTagFilter());

      for (let i = 0; i < TAG_COLOR_PALETTE.length; i++) {
        act(() => {
          result.current.addTagOption(`Tag ${i}`);
        });
      }

      // Add one more tag to test wrap-around
      act(() => {
        result.current.addTagOption('Wrapped Tag');
      });

      const wrappedTag = result.current.tagOptions.find(
        (opt) => opt.value === 'wrapped-tag'
      );
      expect(wrappedTag?.dotClass).toBe(TAG_COLOR_PALETTE[0]);
    });

    it('ignores empty, whitespace-only, or duplicate tag names', () => {
      const { result } = renderHook(() => useEventTagFilter());

      act(() => {
        result.current.addTagOption('');
        result.current.addTagOption('   ');
        result.current.addTagOption('Família'); // Already exists in DEFAULT_EVENT_TAGS
      });

      expect(mockCreateMutate).not.toHaveBeenCalled();
      expect(result.current.tagOptions).toEqual(DEFAULT_EVENT_TAGS);
    });
  });

  describe('Tag Deletion & System Tags Immunity', () => {
    it('prevents deletion of default system tags (SYSTEM_TAG_VALUES)', () => {
      const { result } = renderHook(() => useEventTagFilter());

      SYSTEM_TAG_VALUES.forEach((systemVal) => {
        act(() => {
          result.current.removeTagOption(systemVal);
        });
      });

      expect(mockDeleteMutate).not.toHaveBeenCalled();
      expect(result.current.tagOptions).toEqual(DEFAULT_EVENT_TAGS);
    });

    it('deletes custom tag, removes it from state and localStorage, and calls API mutation', () => {
      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      act(() => {
        result.current.addTagOption('Curso');
      });

      expect(
        result.current.tagOptions.some((opt) => opt.value === 'curso')
      ).toBe(true);

      act(() => {
        result.current.removeTagOption('curso');
      });

      expect(
        result.current.tagOptions.some((opt) => opt.value === 'curso')
      ).toBe(false);

      const stored = JSON.parse(
        localStorage.getItem('festrack:shop-test-1:event_tags')
      );
      expect(stored).toEqual([]);
    });

    it('calls delete mutation with tagId when tag has an id property', () => {
      useGetEventTags.mockReturnValue({
        data: [
          {
            id: 'server-tag-1',
            slug: 'custom-server',
            name: 'Custom Server',
            color: 'bg-indigo-400',
            is_system: false,
          },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      act(() => {
        result.current.removeTagOption('custom-server', 'server-tag-1');
      });

      expect(mockDeleteMutate).toHaveBeenCalledWith({
        tagId: 'server-tag-1',
        shopId: 'shop-test-1',
      });
    });

    it('removes deleted tag from selectedTags if it was selected', () => {
      const { result } = renderHook(() => useEventTagFilter());

      act(() => {
        result.current.addTagOption('Conferência');
      });

      act(() => {
        result.current.toggleTagFilter('conferencia', true);
      });

      act(() => {
        result.current.removeTagOption('conferencia');
      });

      expect(result.current.selectedTags).not.toContain('conferencia');
    });
  });

  describe('Filter Toggling & Logic', () => {
    it('sets showAllTags explicitly via setShowAllTags', () => {
      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      act(() => {
        result.current.setShowAllTags(false);
      });

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(
        DEFAULT_EVENT_TAGS.map((t) => t.value)
      );

      act(() => {
        result.current.setShowAllTags(true);
      });

      expect(result.current.showAllTags).toBe(true);
      expect(result.current.selectedTags).toEqual([]);
    });

    it('unchecking a tag while showAllTags is true deselects that tag and selects all others', () => {
      const { result } = renderHook(() => useEventTagFilter());

      act(() => {
        result.current.toggleTagFilter('family', false);
      });

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).not.toContain('family');
      expect(result.current.selectedTags).toContain('business');
      expect(result.current.selectedTags).toContain('personal');
    });

    it('toggles individual tags on and off, resetting to showAll when all or none are selected', () => {
      const { result } = renderHook(() => useEventTagFilter());

      // Start with only 'business' selected
      act(() => {
        result.current.setShowAllTags(false);
      });
      act(() => {
        DEFAULT_EVENT_TAGS.forEach((tag) => {
          if (tag.value !== 'business') {
            result.current.toggleTagFilter(tag.value, false);
          }
        });
      });

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(['business']);

      // Uncheck 'business' -> 0 selected -> resets to showAllTags: true
      act(() => {
        result.current.toggleTagFilter('business', false);
      });

      expect(result.current.showAllTags).toBe(true);
      expect(result.current.selectedTags).toEqual([]);
    });
  });

  describe('filteredEvents Calculation', () => {
    const mockEvents = [
      { id: '1', title: 'Almoço em Família', tag: 'family' },
      { id: '2', title: 'Reunião de Negócios', rawEvent: { tag: 'business' } },
      { id: '3', title: 'Consulta Médica', rawEvent: { category: 'personal' } },
      { id: '4', title: 'Sem etiqueta explícita' }, // fallback to 'etc'
    ];

    it('returns all events when showAllTags is true', () => {
      const { result } = renderHook(() => useEventTagFilter(mockEvents));

      expect(result.current.filteredEvents).toHaveLength(4);
      expect(result.current.filteredEvents).toEqual(mockEvents);
    });

    it('filters events matching the selectedTags', () => {
      const { result } = renderHook(() => useEventTagFilter(mockEvents));

      act(() => {
        result.current.toggleTagFilter('family', false);
      });
      // Now all except 'family' are selected: business, personal, holiday, etc
      expect(result.current.filteredEvents.map((e) => e.id)).toEqual([
        '2',
        '3',
        '4',
      ]);

      act(() => {
        result.current.setShowAllTags(false);
      });
      // Now all are selected. Let's filter to just 'family'
      act(() => {
        DEFAULT_EVENT_TAGS.forEach((t) => {
          if (t.value !== 'family') {
            result.current.toggleTagFilter(t.value, false);
          }
        });
      });

      expect(result.current.filteredEvents.map((e) => e.id)).toEqual(['1']);
    });
  });

  describe('Cohesive tagFilter Prop Object', () => {
    it('packages all required properties and handlers in tagFilter object', () => {
      const { result } = renderHook(() => useEventTagFilter());

      const { tagFilter } = result.current;
      expect(tagFilter).toBeDefined();
      expect(tagFilter.showAllTags).toBe(result.current.showAllTags);
      expect(tagFilter.selectedTags).toEqual(result.current.selectedTags);
      expect(tagFilter.tagOptions).toEqual(result.current.tagOptions);
      expect(typeof tagFilter.onSetShowAllTags).toBe('function');
      expect(typeof tagFilter.onToggleTagFilter).toBe('function');
      expect(typeof tagFilter.onAddTagOption).toBe('function');
      expect(typeof tagFilter.onRemoveTagOption).toBe('function');

      // Test handler forwarding
      act(() => {
        tagFilter.onAddTagOption('Nova Tag Via Prop');
      });

      expect(
        result.current.tagOptions.some(
          (opt) => opt.value === 'nova-tag-via-prop'
        )
      ).toBe(true);
    });
  });
});
