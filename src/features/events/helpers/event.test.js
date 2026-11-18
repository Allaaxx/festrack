import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  formatEventDate,
  formatEventDateRange,
  formatEventDateToApi,
  getEventStatus,
  mapEventToCalendarItem,
  normalizeEventAuthor,
  parseEventDate,
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

  it('maps allDay: true events by pure civil dates with 00:00:00 start and 23:59:59 local end (#155)', () => {
    const item = mapEventToCalendarItem({
      id: 'ev-all-day',
      name: 'Feriado Civil',
      startDate: '2026-11-18T00:00:00.000Z',
      endDate: '2026-11-18T00:00:00.000Z',
      allDay: true,
    });

    expect(item.allDay).toBe(true);
    expect(item.start).toEqual(new Date(2026, 10, 18, 0, 0, 0));
    expect(item.end).toEqual(new Date(2026, 10, 18, 23, 59, 59));
  });

  it('keeps allDay: false for 00:00-23:59 timed events when explicit allDay is false (#155)', () => {
    const item = mapEventToCalendarItem({
      id: 'ev-timed-24h',
      name: 'Plantão 24h',
      startDate: '2026-11-18T00:00:00',
      endDate: '2026-11-18T23:59:00',
      allDay: false,
    });

    expect(item.allDay).toBe(false);
    expect(item.start).toEqual(new Date(2026, 10, 18, 0, 0, 0));
    expect(item.end).toEqual(new Date(2026, 10, 18, 23, 59, 0));
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

  it('formats all-day start and end dates as UTC civil date bounds (T00:00:00.000Z / T23:59:59.000Z)', () => {
    const start = formatEventDateToApi('2026-10-20', 'start', true);
    const end = formatEventDateToApi('2026-10-20', 'end', true);

    expect(start).toBe('2026-10-20T00:00:00.000Z');
    expect(end).toBe('2026-10-20T23:59:59.000Z');

    const localDate = new Date(2026, 10, 18, 0, 0, 0);
    expect(formatEventDateToApi(localDate, 'start', true)).toBe(
      '2026-11-18T00:00:00.000Z'
    );
    expect(formatEventDateToApi(localDate, 'end', true)).toBe(
      '2026-11-18T23:59:59.000Z'
    );
    expect(formatEventDateToApi('2026-11-18T23:59:59.000Z', 'end', true)).toBe(
      '2026-11-18T23:59:59.000Z'
    );
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

describe('parseEventDate', () => {
  it('parses pure YYYY-MM-DD strings as local civil dates without timezone shift', () => {
    const parsed = parseEventDate('2026-11-18');
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(10);
    expect(parsed.getDate()).toBe(18);
    expect(parsed.getHours()).toBe(0);
    expect(parsed.getMinutes()).toBe(0);
    expect(parsed.getSeconds()).toBe(0);
  });

  it('extracts pure civil date for allDay: true timestamps ignoring time and UTC offset', () => {
    const start = parseEventDate('2026-11-18T00:00:00.000Z', { allDay: true });
    const end = parseEventDate('2026-11-18T23:59:59.000Z', { allDay: true });
    const shifted = parseEventDate('2026-11-18T02:59:59-03:00', {
      allDay: true,
    });

    for (const date of [start, end, shifted]) {
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(10);
      expect(date.getDate()).toBe(18);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    }
  });

  it('returns null for invalid or empty values', () => {
    expect(parseEventDate(null)).toBeNull();
    expect(parseEventDate('')).toBeNull();
    expect(parseEventDate('invalid-date')).toBeNull();
    expect(parseEventDate('2026-02-31', { allDay: true })).toBeNull();
  });
});

describe('formatEventDate and formatEventDateRange', () => {
  it('formats all-day civil dates cleanly when { allDay: true } is forwarded', () => {
    expect(
      formatEventDate('2026-11-18T00:00:00.000Z', { allDay: true })
    ).toBe('18/11/2026');
    expect(
      formatEventDateRange(
        '2026-11-18T00:00:00.000Z',
        '2026-11-20T23:59:59.000Z',
        { allDay: true }
      )
    ).toBe('18/11/2026 até 20/11/2026');
  });
});

describe('getEventStatus', () => {
  it('evaluates status by civil calendar date for allDay: true events', () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    expect(
      getEventStatus({
        startDate: `${todayStr}T00:00:00.000Z`,
        endDate: `${todayStr}T23:59:59.000Z`,
        allDay: true,
      })
    ).toBe('in_progress');

    expect(
      getEventStatus({
        startDate: '2099-12-01T00:00:00.000Z',
        endDate: '2099-12-02T23:59:59.000Z',
        allDay: true,
      })
    ).toBe('scheduled');

    expect(
      getEventStatus({
        startDate: '2020-01-01T00:00:00.000Z',
        endDate: '2020-01-02T23:59:59.000Z',
        allDay: true,
      })
    ).toBe('completed');
  });
});
