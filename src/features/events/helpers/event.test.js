import { describe, expect, it } from 'vitest';

import {
  formatEventDateToApi,
  mapEventToCalendarItem,
  normalizeEventAuthor,
} from './event';

describe('normalizeEventAuthor', () => {
  it('returns default fallback when event and user have no author data', () => {
    const result = normalizeEventAuthor({});
    expect(result).toEqual({
      name: 'Membro',
      email: '',
      avatar: null,
      initials: '—',
      hasAuthor: false,
    });
  });

  it('normalizes author when author is a string', () => {
    const result = normalizeEventAuthor({ author: 'Maria Clara' });
    expect(result).toEqual({
      name: 'Maria Clara',
      email: '',
      avatar: null,
      initials: 'MC',
      hasAuthor: true,
    });
  });

  it('normalizes author with single word string', () => {
    const result = normalizeEventAuthor({ author: 'Lucas' });
    expect(result).toEqual({
      name: 'Lucas',
      email: '',
      avatar: null,
      initials: 'LU',
      hasAuthor: true,
    });
  });

  it('normalizes author when author is an object with name and image', () => {
    const result = normalizeEventAuthor({
      author: {
        name: 'Carlos Drummond',
        image: 'https://example.com/carlos.png',
        email: 'carlos@example.com',
      },
    });
    expect(result).toEqual({
      name: 'Carlos Drummond',
      email: 'carlos@example.com',
      avatar: 'https://example.com/carlos.png',
      initials: 'CD',
      hasAuthor: true,
    });
  });

  it('normalizes author when author is on creator or user or rawEvent', () => {
    const fromRawCreator = normalizeEventAuthor({
      rawEvent: {
        creator: {
          firstName: 'Ana',
          lastName: 'Beatriz',
          avatar: 'https://example.com/ana.png',
        },
      },
    });
    expect(fromRawCreator).toEqual({
      name: 'Ana Beatriz',
      email: '',
      avatar: 'https://example.com/ana.png',
      initials: 'AB',
      hasAuthor: true,
    });
  });

  it('falls back to authenticated user when createdByUserId matches or no author provided', () => {
    const mockUser = {
      id: 'usr-123',
      name: 'Allan Rodrigues',
      image: 'https://example.com/allan.png',
    };

    const result = normalizeEventAuthor(
      { createdByUserId: 'usr-123' },
      mockUser
    );
    expect(result.name).toBe('Allan Rodrigues');
    expect(result.avatar).toBe('https://example.com/allan.png');
    expect(result.initials).toBe('AR');
    expect(result.hasAuthor).toBe(true);
  });

  it('returns "Membro" fallback when createdByUserId is null even if fallbackUser is provided', () => {
    const mockUser = {
      id: 'usr-123',
      name: 'Allan Rodrigues',
      image: 'https://example.com/allan.png',
    };

    const result = normalizeEventAuthor(
      { createdByUserId: null, author: null },
      mockUser
    );
    expect(result).toEqual({
      name: 'Membro',
      email: '',
      avatar: null,
      initials: '—',
      hasAuthor: false,
    });
  });

  it('prefers API author object over fallbackUser even when another member created the event', () => {
    const mockUser = {
      id: 'usr-123',
      name: 'Allan Rodrigues',
    };

    const result = normalizeEventAuthor(
      {
        createdByUserId: 'usr-other',
        author: {
          id: 'usr-other',
          name: '',
          first_name: 'João',
          last_name: 'Souza',
          email: 'joao@example.com',
          image: null,
        },
      },
      mockUser
    );
    expect(result).toEqual({
      name: 'João Souza',
      email: 'joao@example.com',
      avatar: null,
      initials: 'JS',
      hasAuthor: true,
    });
  });
});

describe('mapEventToCalendarItem', () => {
  it('maps description and author attributes faithfully', () => {
    const rawEvent = {
      id: 'ev-test-1',
      name: 'Conferência Anual',
      description: 'Planejamento estratégico e metas',
      author: { name: 'Diretoria' },
      startDate: '2026-11-20T10:00:00',
      endDate: '2026-11-20T18:00:00',
    };

    const item = mapEventToCalendarItem(rawEvent);
    expect(item.id).toBe('ev-test-1');
    expect(item.title).toBe('Conferência Anual');
    expect(item.description).toBe('Planejamento estratégico e metas');
    expect(item.author).toEqual({ name: 'Diretoria' });
    expect(item.rawEvent).toBe(rawEvent);
  });

  it('sets tag to null and color to null for untagged events (#145)', () => {
    const rawEventWithoutTag = {
      id: 'ev-untagged',
      name: 'Reunião Geral',
      startDate: '2026-11-20T10:00:00',
      endDate: '2026-11-20T11:00:00',
    };

    const item = mapEventToCalendarItem(rawEventWithoutTag);
    expect(item.tag).toBeNull();
    expect(item.color).toBeNull();

    const rawEventWithNullTag = {
      ...rawEventWithoutTag,
      tag: null,
    };
    const itemNull = mapEventToCalendarItem(rawEventWithNullTag);
    expect(itemNull.tag).toBeNull();
    expect(itemNull.color).toBeNull();
  });

  it('maps tag and assigns tag to color when tag is provided (#145)', () => {
    const rawEventWithTag = {
      id: 'ev-tagged',
      name: 'Workshop de Design',
      startDate: '2026-11-20T10:00:00',
      endDate: '2026-11-20T11:00:00',
      tag: 'workshop',
    };

    const item = mapEventToCalendarItem(rawEventWithTag);
    expect(item.tag).toBe('workshop');
    expect(item.color).toBe('workshop');
  });
});

describe('formatEventDateToApi', () => {
  it('formats a timed event with explicit local timezone offset instead of .000Z', () => {
    const result = formatEventDateToApi('2026-10-20', 'start', false, '14:00');

    expect(result).not.toContain('.000Z');
    expect(result).toMatch(/^2026-10-20T14:00:00([+-]\d{2}:\d{2}|Z)$/);

    const parsed = new Date(result);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9);
    expect(parsed.getDate()).toBe(20);
    expect(parsed.getHours()).toBe(14);
    expect(parsed.getMinutes()).toBe(0);
  });

  it('formats all-day start and end dates with explicit local timezone offset', () => {
    const start = formatEventDateToApi('2026-10-20', 'start', true);
    const end = formatEventDateToApi('2026-10-20', 'end', true);

    expect(start).not.toContain('.000Z');
    expect(end).not.toContain('.000Z');
    expect(start).toMatch(/^2026-10-20T00:00:00([+-]\d{2}:\d{2}|Z)$/);
    expect(end).toMatch(/^2026-10-20T23:59:59([+-]\d{2}:\d{2}|Z)$/);
  });

  it('extracts hours and minutes from a Date instance when timeStr is omitted', () => {
    const localDate = new Date(2026, 9, 20, 16, 30, 0);
    const result = formatEventDateToApi(localDate, 'start', false);

    expect(result).not.toContain('.000Z');
    expect(result).toMatch(/^2026-10-20T16:30:00([+-]\d{2}:\d{2}|Z)$/);
  });

  it('returns empty string for empty or invalid date values', () => {
    expect(formatEventDateToApi(null)).toBe('');
    expect(formatEventDateToApi('')).toBe('');
    expect(formatEventDateToApi('invalid-date')).toBe('');
  });
});
