import { renderHook } from '@testing-library/react';
import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { useEventsSidebar } from './use-events-sidebar';

describe('useEventsSidebar - Pink Dots for Untagged & Orphan Events', () => {
  const dateKey = format(new Date(), 'yyyy-MM-dd');
  const shopTagOptions = [
    { value: 'workshop', label: 'Workshop', dotClass: 'bg-indigo-400' },
  ];

  it('renders pink dot (bg-pink-400) for untagged events in dotsByDate', () => {
    const events = [
      {
        id: 'ev-1',
        title: 'Evento sem tag',
        start: new Date(),
        end: new Date(),
        tag: null,
      },
    ];

    const { result } = renderHook(() =>
      useEventsSidebar({ events, tagOptions: shopTagOptions })
    );

    const dayDots = result.current.dotsByDate.get(dateKey);
    expect(dayDots).toBeDefined();
    expect(dayDots.colors).toContain('bg-pink-400');
  });

  it('renders pink dot (bg-pink-400) for orphan tag events in dotsByDate', () => {
    const events = [
      {
        id: 'ev-orphan',
        title: 'Evento com tag excluída',
        start: new Date(),
        end: new Date(),
        tag: 'deleted-tag-slug',
      },
    ];

    const { result } = renderHook(() =>
      useEventsSidebar({ events, tagOptions: shopTagOptions })
    );

    const dayDots = result.current.dotsByDate.get(dateKey);
    expect(dayDots).toBeDefined();
    expect(dayDots.colors).toContain('bg-pink-400');
  });

  it('renders tag dot color for valid tagged events in dotsByDate', () => {
    const events = [
      {
        id: 'ev-tagged',
        title: 'Workshop',
        start: new Date(),
        end: new Date(),
        tag: 'workshop',
      },
    ];

    const { result } = renderHook(() =>
      useEventsSidebar({ events, tagOptions: shopTagOptions })
    );

    const dayDots = result.current.dotsByDate.get(dateKey);
    expect(dayDots).toBeDefined();
    expect(dayDots.colors).toContain('bg-indigo-400');
  });
});
