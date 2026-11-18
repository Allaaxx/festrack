import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useShopContext } from '@/contexts/shop';
import {
  useCreateEventTag,
  useDeleteEventTag,
  useGetEventTags,
} from '@/features/events/api/hooks';
import { TAG_COLOR_PALETTE } from '@/features/events/constants';
import { useEventTagFilter } from '@/features/events/hooks/use-event-tag-filter';

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
}));

vi.mock('@/features/events/api/hooks', () => ({
  useGetEventTags: vi.fn(),
  useCreateEventTag: vi.fn(),
  useDeleteEventTag: vi.fn(),
}));

describe('useEventTagFilter - Server-Only Tags & Shop Filter State', () => {
  let mockCreateMutateAsync;
  let mockCreateMutate;
  let mockDeleteMutate;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockCreateMutateAsync = vi
      .fn()
      .mockResolvedValue({ id: 'tag-new', slug: 'nova-tag', name: 'Nova Tag' });
    mockCreateMutate = vi.fn();
    mockDeleteMutate = vi.fn();

    useShopContext.mockReturnValue({
      activeShop: { id: 'shop-test-1' },
    });

    useGetEventTags.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    useCreateEventTag.mockReturnValue({
      mutate: mockCreateMutate,
      mutateAsync: mockCreateMutateAsync,
    });

    useDeleteEventTag.mockReturnValue({
      mutate: mockDeleteMutate,
    });
  });

  describe('Initialization and Storage Fallback', () => {
    it('initializes with empty tagOptions when server tags are empty and localStorage has no filters', () => {
      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.showAllTags).toBe(true);
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.tagOptions).toEqual([]);
      expect(result.current.tagFilter).toBeDefined();
      expect(result.current.tagFilter.showAllTags).toBe(true);
      expect(result.current.tagFilter.selectedTags).toEqual([]);
      expect(result.current.tagFilter.tagOptions).toEqual([]);
    });

    it('derives tagOptions exclusively from serverTags returned by useGetEventTags', () => {
      const serverTags = [
        {
          id: '1',
          slug: 'conferencia',
          name: 'Conferência',
          color: 'bg-indigo-400',
        },
        { id: '2', slug: 'reuniao', name: 'Reunião', color: 'bg-teal-400' },
      ];
      useGetEventTags.mockReturnValue({
        data: serverTags,
        isLoading: false,
      });

      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.tagOptions).toEqual([
        {
          id: '1',
          value: 'conferencia',
          label: 'Conferência',
          dotClass: 'bg-indigo-400',
        },
        {
          id: '2',
          value: 'reuniao',
          label: 'Reunião',
          dotClass: 'bg-teal-400',
        },
      ]);
    });

    it('loads filters from scoped localStorage key for activeShop and ignores legacy event_tags key', () => {
      const storedFilters = {
        showAllTags: false,
        selectedTags: ['workshop'],
      };

      // Legacy key should be completely ignored
      localStorage.setItem(
        'festrack:shop-test-1:event_tags',
        JSON.stringify([{ value: 'legacy-tag', label: 'Legacy' }])
      );
      localStorage.setItem(
        'festrack:shop-test-1:event_tag_filters',
        JSON.stringify(storedFilters)
      );

      useGetEventTags.mockReturnValue({
        data: [
          {
            id: 'w1',
            slug: 'workshop',
            name: 'Workshop',
            color: 'bg-teal-400',
          },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(['workshop']);
      // tagOptions comes solely from serverTags, never from legacy localStorage
      expect(result.current.tagOptions).toEqual([
        {
          id: 'w1',
          value: 'workshop',
          label: 'Workshop',
          dotClass: 'bg-teal-400',
        },
      ]);
    });

    it('falls back to unscoped localStorage filter key when shopId is undefined', () => {
      useShopContext.mockReturnValue({
        activeShop: null,
      });

      const unscopedFilters = {
        showAllTags: false,
        selectedTags: ['meetup'],
      };

      localStorage.setItem(
        'festrack:event_tag_filters',
        JSON.stringify(unscopedFilters)
      );

      useGetEventTags.mockReturnValue({
        data: [
          { id: 'm1', slug: 'meetup', name: 'Meetup', color: 'bg-teal-400' },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(['meetup']);
    });

    it('handles corrupted localStorage JSON gracefully without throwing', () => {
      localStorage.setItem(
        'festrack:shop-test-1:event_tag_filters',
        'not-a-json'
      );

      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.showAllTags).toBe(true);
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.tagOptions).toEqual([]);
    });

    it('supports flexible argument signatures: events array, options object, or both', () => {
      const sampleEvents = [{ id: '1', title: 'Test', tag: 'evento' }];

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
    it('switches stored filter state when shopId changes', () => {
      localStorage.setItem(
        'festrack:shop-A:event_tag_filters',
        JSON.stringify({ showAllTags: false, selectedTags: ['tag-a'] })
      );
      localStorage.setItem(
        'festrack:shop-B:event_tag_filters',
        JSON.stringify({ showAllTags: false, selectedTags: ['tag-b'] })
      );

      const { result, rerender } = renderHook(
        ({ shopId }) => useEventTagFilter([], { shopId }),
        { initialProps: { shopId: 'shop-A' } }
      );

      expect(result.current.selectedTags).toEqual(['tag-a']);

      // Re-render with shop-B
      rerender({ shopId: 'shop-B' });

      expect(result.current.selectedTags).toEqual(['tag-b']);
    });
  });

  describe('Custom Tag Creation & Color Assignment', () => {
    it('creates tag non-optimistically: waits for server confirmation and does not add locally', async () => {
      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      await act(async () => {
        await result.current.addTagOption('Congresso');
      });

      // Called mutateAsync with proper payload
      const expectedFirstColor = TAG_COLOR_PALETTE[0];
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        name: 'Congresso',
        color: expectedFirstColor,
        slug: 'congresso',
        shopId: 'shop-test-1',
      });

      // Non-optimistic: tagOptions is still empty until serverTags hook updates
      expect(result.current.tagOptions).toEqual([]);

      // Never written to localStorage for tags
      expect(
        localStorage.getItem('festrack:shop-test-1:event_tags')
      ).toBeNull();
    });

    it('assigns the first available color in TAG_COLOR_PALETTE not currently used', async () => {
      // Tags 0 and 1 are in use
      useGetEventTags.mockReturnValue({
        data: [
          {
            id: '1',
            slug: 'tag-0',
            name: 'Tag 0',
            color: TAG_COLOR_PALETTE[0],
          },
          {
            id: '2',
            slug: 'tag-1',
            name: 'Tag 1',
            color: TAG_COLOR_PALETTE[1],
          },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      await act(async () => {
        await result.current.addTagOption('Nova Tag');
      });

      // Should pick TAG_COLOR_PALETTE[2]
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          color: TAG_COLOR_PALETTE[2],
        })
      );
    });

    it('picks a freed color if an earlier color is not in use', async () => {
      // Tags use color 0 and color 2, but color 1 is free
      useGetEventTags.mockReturnValue({
        data: [
          {
            id: '1',
            slug: 'tag-0',
            name: 'Tag 0',
            color: TAG_COLOR_PALETTE[0],
          },
          {
            id: '3',
            slug: 'tag-2',
            name: 'Tag 2',
            color: TAG_COLOR_PALETTE[2],
          },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      await act(async () => {
        await result.current.addTagOption('Tag Cor 1');
      });

      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          color: TAG_COLOR_PALETTE[1],
        })
      );
    });

    it('repeats from the beginning of TAG_COLOR_PALETTE when all colors are in use', async () => {
      const allColorsTags = TAG_COLOR_PALETTE.map((color, index) => ({
        id: `id-${index}`,
        slug: `tag-${index}`,
        name: `Tag ${index}`,
        color,
      }));

      useGetEventTags.mockReturnValue({
        data: allColorsTags,
        isLoading: false,
      });

      const { result } = renderHook(() => useEventTagFilter());

      await act(async () => {
        await result.current.addTagOption('Tag Excedente');
      });

      // All 6 colors are used; wraps to index 0
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          color: TAG_COLOR_PALETTE[0],
        })
      );
    });

    it('shows Portuguese error toast, returns false, and does not add tag when createTagMutation rejects', async () => {
      mockCreateMutateAsync.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      let addResult;
      await act(async () => {
        addResult = await result.current.addTagOption('Tag Que Falha');
      });

      expect(addResult).toBe(false);
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        title: 'Erro ao criar etiqueta',
        description: 'Não foi possível criar a etiqueta. Tente novamente.',
      });

      expect(result.current.tagOptions).toEqual([]);
      expect(
        localStorage.getItem('festrack:shop-test-1:event_tags')
      ).toBeNull();
    });

    it('supports mutate-only mocks when mutateAsync is not provided', async () => {
      const createdTag = {
        id: 't-mutate',
        slug: 'casamento',
        name: 'Casamento',
        color: 'bg-teal-400',
      };
      useCreateEventTag.mockReturnValue({
        mutate: (payload, { onSuccess }) => onSuccess(createdTag),
      });

      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      let addResult;
      await act(async () => {
        addResult = await result.current.addTagOption('Casamento');
      });

      expect(addResult).toEqual({
        id: 't-mutate',
        value: 'casamento',
        label: 'Casamento',
        dotClass: 'bg-teal-400',
      });
    });

    it('returns existing option when tag already exists and ignores empty/whitespace names', async () => {
      useGetEventTags.mockReturnValue({
        data: [
          {
            id: '1',
            slug: 'workshop',
            name: 'Workshop',
            color: TAG_COLOR_PALETTE[0],
          },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() => useEventTagFilter());

      let existingByName;
      let existingBySlug;
      await act(async () => {
        await result.current.addTagOption('');
        await result.current.addTagOption('   ');
        existingByName = await result.current.addTagOption('Workshop');
        existingBySlug = await result.current.addTagOption('workshop');
      });

      expect(existingByName).toEqual({
        id: '1',
        value: 'workshop',
        label: 'Workshop',
        dotClass: TAG_COLOR_PALETTE[0],
      });
      expect(existingBySlug).toEqual(existingByName);
      expect(mockCreateMutateAsync).not.toHaveBeenCalled();
      expect(toast.add).not.toHaveBeenCalled();
    });
  });

  describe('Tag Deletion & Removal from Selected Filters', () => {
    it('allows deleting any tag without system tags immunity', () => {
      useGetEventTags.mockReturnValue({
        data: [
          {
            id: '1',
            slug: 'qualquer-tag',
            name: 'Qualquer Tag',
            color: 'bg-indigo-400',
            is_system: true,
          },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      act(() => {
        result.current.removeTagOption('qualquer-tag', '1');
      });

      expect(mockDeleteMutate).toHaveBeenCalledWith({
        tagId: '1',
        shopId: 'shop-test-1',
      });
      // No tags stored in localStorage
      expect(
        localStorage.getItem('festrack:shop-test-1:event_tags')
      ).toBeNull();
    });

    it('removes deleted tag from selectedTags and resets showAllTags if nextSelected is empty', () => {
      useGetEventTags.mockReturnValue({
        data: [
          {
            id: '1',
            slug: 'conferencia',
            name: 'Conferência',
            color: 'bg-indigo-400',
          },
          { id: '2', slug: 'palestra', name: 'Palestra', color: 'bg-teal-400' },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() => useEventTagFilter());

      // Filter to only 'conferencia'
      act(() => {
        result.current.setShowAllTags(false);
      });
      act(() => {
        result.current.toggleTagFilter('palestra', false);
      });

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(['conferencia']);

      // Remove 'conferencia'
      act(() => {
        result.current.removeTagOption('conferencia', '1');
      });

      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.showAllTags).toBe(true);

      // Persisted to localStorage
      const stored = JSON.parse(
        localStorage.getItem('festrack:shop-test-1:event_tag_filters')
      );
      expect(stored.showAllTags).toBe(true);
      expect(stored.selectedTags).toEqual([]);
    });

    it('resets showAllTags to true when remaining selected tags equal all remaining options', () => {
      useGetEventTags.mockReturnValue({
        data: [
          { id: '1', slug: 'tag-1', name: 'Tag 1', color: 'bg-indigo-400' },
          { id: '2', slug: 'tag-2', name: 'Tag 2', color: 'bg-teal-400' },
          { id: '3', slug: 'tag-3', name: 'Tag 3', color: 'bg-orange-400' },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() => useEventTagFilter());

      act(() => {
        result.current.setShowAllTags(false);
      });
      // Deselect 'tag-3' -> selectedTags: ['tag-1', 'tag-2']
      act(() => {
        result.current.toggleTagFilter('tag-3', false);
      });
      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(['tag-1', 'tag-2']);

      // Remove 'tag-3' -> remainingOptions is ['tag-1', 'tag-2'] -> equals nextSelected -> resets showAllTags: true
      act(() => {
        result.current.removeTagOption('tag-3', '3');
      });

      expect(result.current.showAllTags).toBe(true);
      expect(result.current.selectedTags).toEqual([]);
    });
  });

  describe('Filter Toggling & Logic', () => {
    const mockTags = [
      { id: '1', slug: 'tag-1', name: 'Tag 1', color: 'bg-indigo-400' },
      { id: '2', slug: 'tag-2', name: 'Tag 2', color: 'bg-teal-400' },
      { id: '3', slug: 'tag-3', name: 'Tag 3', color: 'bg-orange-400' },
    ];

    beforeEach(() => {
      useGetEventTags.mockReturnValue({
        data: mockTags,
        isLoading: false,
      });
    });

    it('sets showAllTags explicitly via setShowAllTags', () => {
      const { result } = renderHook(() =>
        useEventTagFilter([], { shopId: 'shop-test-1' })
      );

      act(() => {
        result.current.setShowAllTags(false);
      });

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(['tag-1', 'tag-2', 'tag-3']);

      act(() => {
        result.current.setShowAllTags(true);
      });

      expect(result.current.showAllTags).toBe(true);
      expect(result.current.selectedTags).toEqual([]);
    });

    it('unchecking a tag while showAllTags is true deselects that tag and selects all others', () => {
      const { result } = renderHook(() => useEventTagFilter());

      act(() => {
        result.current.toggleTagFilter('tag-1', false);
      });

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).not.toContain('tag-1');
      expect(result.current.selectedTags).toEqual(['tag-2', 'tag-3']);
    });

    it('toggles individual tags on and off, resetting to showAll when all or none are selected', () => {
      const { result } = renderHook(() => useEventTagFilter());

      act(() => {
        result.current.setShowAllTags(false);
      });
      act(() => {
        result.current.toggleTagFilter('tag-1', false);
        result.current.toggleTagFilter('tag-2', false);
      });

      expect(result.current.showAllTags).toBe(false);
      expect(result.current.selectedTags).toEqual(['tag-3']);

      // Deselecting the last tag resets to showAllTags: true
      act(() => {
        result.current.toggleTagFilter('tag-3', false);
      });

      expect(result.current.showAllTags).toBe(true);
      expect(result.current.selectedTags).toEqual([]);
    });
  });

  describe('filteredEvents Calculation', () => {
    const mockTags = [
      { id: '1', slug: 'empresa', name: 'Empresa', color: 'bg-indigo-400' },
      { id: '2', slug: 'pessoal', name: 'Pessoal', color: 'bg-teal-400' },
    ];

    const mockEvents = [
      { id: '1', title: 'Reunião de Empresa', tag: 'empresa' },
      { id: '2', title: 'Médico', rawEvent: { tag: 'pessoal' } },
      { id: '3', title: 'Sem etiqueta explícita', tag: null },
      { id: '4', title: 'Orphan tag', tag: 'tag-deletada' },
    ];

    beforeEach(() => {
      useGetEventTags.mockReturnValue({
        data: mockTags,
        isLoading: false,
      });
    });

    it('returns all events when showAllTags is true, including untagged and orphan events', () => {
      const { result } = renderHook(() => useEventTagFilter(mockEvents));

      expect(result.current.filteredEvents).toHaveLength(4);
      expect(result.current.filteredEvents).toEqual(mockEvents);
    });

    it('filters events matching the selectedTags and does not match untagged or orphan events (no fallback to etc)', () => {
      const { result } = renderHook(() => useEventTagFilter(mockEvents));

      act(() => {
        result.current.setShowAllTags(false);
      });
      act(() => {
        result.current.toggleTagFilter('pessoal', false);
      });

      // Only 'empresa' is selected
      expect(result.current.filteredEvents.map((e) => e.id)).toEqual(['1']);

      // Untagged and orphan events never match selected tags
      expect(result.current.filteredEvents.some((e) => e.id === '3')).toBe(
        false
      );
      expect(result.current.filteredEvents.some((e) => e.id === '4')).toBe(
        false
      );
    });
  });

  describe('Cohesive tagFilter Prop Object', () => {
    it('packages all required properties and handlers in tagFilter object', async () => {
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

      // Concise action names (Spec #135)
      expect(typeof tagFilter.setShowAll).toBe('function');
      expect(typeof tagFilter.toggleTag).toBe('function');
      expect(typeof tagFilter.addTag).toBe('function');
      expect(typeof tagFilter.removeTag).toBe('function');

      // Test handler forwarding
      await act(async () => {
        await tagFilter.onAddTagOption('Nova Tag Via Prop');
      });

      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nova Tag Via Prop',
          slug: 'nova-tag-via-prop',
        })
      );
    });

    it('supports concise action names (toggleTag, setShowAll, addTag, removeTag) alongside verbose names (#135)', async () => {
      useGetEventTags.mockReturnValue({
        data: [
          { id: 's1', slug: 'sessao', name: 'Sessao', color: 'bg-indigo-400' },
        ],
        isLoading: false,
      });

      const { result } = renderHook(() => useEventTagFilter());

      expect(typeof result.current.setShowAll).toBe('function');
      expect(typeof result.current.toggleTag).toBe('function');
      expect(typeof result.current.addTag).toBe('function');
      expect(typeof result.current.removeTag).toBe('function');

      await act(async () => {
        await result.current.addTag('Nova Sessao');
      });
      expect(mockCreateMutateAsync).toHaveBeenCalled();

      act(() => {
        result.current.setShowAll(false);
      });
      expect(result.current.showAllTags).toBe(false);

      act(() => {
        result.current.toggleTag('sessao', true);
      });

      act(() => {
        result.current.removeTag('sessao', 's1');
      });
      expect(mockDeleteMutate).toHaveBeenCalledWith(
        expect.objectContaining({ tagId: 's1' })
      );
    });

    it('does not expose proscribed Glossary terms (*Type*) (#135)', () => {
      const { result } = renderHook(() => useEventTagFilter());

      expect(result.current.showAllTypes).toBeUndefined();
      expect(result.current.selectedTypes).toBeUndefined();
      expect(result.current.eventTypeOptions).toBeUndefined();
      expect(result.current.onSetShowAllTypes).toBeUndefined();
      expect(result.current.onToggleTypeFilter).toBeUndefined();
      expect(result.current.onAddEventTypeOption).toBeUndefined();
      expect(result.current.onRemoveEventTypeOption).toBeUndefined();

      expect(result.current.tagFilter.showAllTypes).toBeUndefined();
      expect(result.current.tagFilter.selectedTypes).toBeUndefined();
      expect(result.current.tagFilter.eventTypeOptions).toBeUndefined();
      expect(result.current.tagFilter.onSetShowAllTypes).toBeUndefined();
      expect(result.current.tagFilter.onToggleTypeFilter).toBeUndefined();
      expect(result.current.tagFilter.onAddEventTypeOption).toBeUndefined();
      expect(result.current.tagFilter.onRemoveEventTypeOption).toBeUndefined();
    });
  });
});
