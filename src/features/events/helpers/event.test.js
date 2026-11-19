import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  endOfCivilDay,
  formatEventDate,
  formatEventDateRange,
  formatEventDateToApi,
  getEventStatus,
  mapEventToCalendarItem,
  normalizeEventAuthor,
  parseCivilDate,
  parseEventDate,
  parseEventTime,
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

  it('converts night-time Timed Event UTC bounds (Z) to local day and time (#156)', () => {
    const startUtc = '2026-11-19T01:00:00.000Z';
    const endUtc = '2026-11-19T02:30:00.000Z';

    const item = mapEventToCalendarItem({
      id: 'ev-night-timed',
      name: 'Jantar Noturno',
      startDate: startUtc,
      endDate: endUtc,
      allDay: false,
    });

    expect(item.allDay).toBe(false);
    expect(item.start).toEqual(new Date(startUtc));
    expect(item.end).toEqual(new Date(endUtc));
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

  it('preserves converted local date and time for ISO strings with Z or offset when timeStr is omitted', () => {
    const utcStart = '2026-11-19T01:00:00.000Z';
    const utcEnd = '2026-11-19T02:30:00.000Z';
    const utcLocalMidnight = '2026-11-19T03:00:00.000Z';

    const formattedStart = formatEventDateToApi(utcStart, 'start', false);
    const formattedEnd = formatEventDateToApi(utcEnd, 'end', false);
    const formattedMidnightEnd = formatEventDateToApi(
      utcLocalMidnight,
      'end',
      false
    );

    expect(new Date(formattedStart).getTime()).toBe(
      new Date(utcStart).getTime()
    );
    expect(formattedStart).toBe(
      format(new Date(utcStart), "yyyy-MM-dd'T'HH:mm:00XXX")
    );
    expect(new Date(formattedEnd).getTime()).toBe(new Date(utcEnd).getTime());
    expect(formattedEnd).toBe(
      format(new Date(utcEnd), "yyyy-MM-dd'T'HH:mm:00XXX")
    );
    expect(new Date(formattedMidnightEnd).getTime()).toBe(
      new Date(utcLocalMidnight).getTime()
    );

    const expectedDay = format(new Date(utcStart), 'yyyy-MM-dd');
    const withOverride = formatEventDateToApi(utcStart, 'start', false, '22:15');
    expect(withOverride.startsWith(`${expectedDay}T22:15:00`)).toBe(true);
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

  it('parses Z and explicit offset timestamps into local timezone when allDay is false', () => {
    const utcNight = '2026-11-19T01:00:00.000Z';
    const expectedUtcNight = new Date(utcNight);
    const parsedUtcNight = parseEventDate(utcNight, { allDay: false });

    expect(parsedUtcNight).toBeInstanceOf(Date);
    expect(parsedUtcNight.getTime()).toBe(expectedUtcNight.getTime());
    expect(parsedUtcNight.getFullYear()).toBe(expectedUtcNight.getFullYear());
    expect(parsedUtcNight.getMonth()).toBe(expectedUtcNight.getMonth());
    expect(parsedUtcNight.getDate()).toBe(expectedUtcNight.getDate());
    expect(parsedUtcNight.getHours()).toBe(expectedUtcNight.getHours());
    expect(parsedUtcNight.getMinutes()).toBe(expectedUtcNight.getMinutes());

    const offsetColon = '2026-11-18T22:00:00-03:00';
    const expectedOffsetColon = new Date(offsetColon);
    const parsedOffsetColon = parseEventDate(offsetColon);
    expect(parsedOffsetColon.getTime()).toBe(expectedOffsetColon.getTime());

    const offsetCompact = '2026-11-18T22:30:00+0200';
    const expectedOffsetCompact = new Date('2026-11-18T22:30:00+02:00');
    const parsedOffsetCompact = parseEventDate(offsetCompact, { allDay: false });
    expect(parsedOffsetCompact.getTime()).toBe(expectedOffsetCompact.getTime());
  });

  it('preserves local wall-clock parsing for naive YYYY-MM-DDTHH:mm[:ss] strings without timezone suffix', () => {
    const parsedNoSeconds = parseEventDate('2026-11-18T22:00', {
      allDay: false,
    });
    expect(parsedNoSeconds).toEqual(new Date(2026, 10, 18, 22, 0, 0));

    const parsedWithSeconds = parseEventDate('2026-11-18T22:30:45');
    expect(parsedWithSeconds).toEqual(new Date(2026, 10, 18, 22, 30, 45));
  });

  it('normalizes valid Date instances to local startOfDay when allDay is true and preserves time when allDay is false', () => {
    const dateWithTime = new Date(2026, 10, 18, 15, 30, 45, 500);

    const allDayParsed = parseEventDate(dateWithTime, { allDay: true });
    expect(allDayParsed).toEqual(new Date(2026, 10, 18, 0, 0, 0, 0));

    const timedParsed = parseEventDate(dateWithTime, { allDay: false });
    expect(timedParsed).toEqual(dateWithTime);

    expect(parseEventDate(new Date('invalid'), { allDay: true })).toBeNull();
  });

  it('returns null for invalid or empty values', () => {
    expect(parseEventDate(null)).toBeNull();
    expect(parseEventDate('')).toBeNull();
    expect(parseEventDate('invalid-date')).toBeNull();
    expect(parseEventDate('2026-02-31', { allDay: true })).toBeNull();
  });
});

describe('parseCivilDate and endOfCivilDay', () => {
  it('parses civil strings, UTC timestamps, and Date instances to local 00:00:00', () => {
    expect(parseCivilDate('2026-11-18')).toEqual(
      new Date(2026, 10, 18, 0, 0, 0, 0)
    );
    expect(parseCivilDate('2026-11-18T23:59:59.000Z')).toEqual(
      new Date(2026, 10, 18, 0, 0, 0, 0)
    );
    expect(parseCivilDate(new Date(2026, 10, 18, 22, 15, 30))).toEqual(
      new Date(2026, 10, 18, 0, 0, 0, 0)
    );
    expect(parseCivilDate(null)).toBeNull();
    expect(parseCivilDate('2026-02-31')).toBeNull();
    expect(parseCivilDate(new Date('invalid'))).toBeNull();
  });

  it('builds local 23:59:59.000 for the civil day of a Date', () => {
    expect(endOfCivilDay(new Date(2026, 10, 18, 8, 30, 0))).toEqual(
      new Date(2026, 10, 18, 23, 59, 59, 0)
    );
  });
});

describe('parseEventTime', () => {
  it('converts Z and explicit offset timestamps to local HH:mm when allDay is false', () => {
    const utcIso = '2026-11-19T01:00:00.000Z';
    expect(parseEventTime(utcIso)).toBe(format(new Date(utcIso), 'HH:mm'));
    expect(parseEventTime(utcIso, { allDay: false })).toBe(
      format(new Date(utcIso), 'HH:mm')
    );

    const offsetIso = '2026-11-18T22:30:00-03:00';
    expect(parseEventTime(offsetIso, { allDay: false })).toBe(
      format(new Date(offsetIso), 'HH:mm')
    );
  });

  it('preserves local wall-clock time for naive strings and Date instances', () => {
    expect(parseEventTime('2026-11-18T22:15')).toBe('22:15');
    expect(parseEventTime(new Date(2026, 10, 18, 22, 45))).toBe('22:45');
    expect(parseEventTime('2026-11-18')).toBe('00:00');
  });

  it('returns 00:00 for allDay: true or invalid/empty inputs', () => {
    expect(parseEventTime('2026-11-19T01:00:00.000Z', { allDay: true })).toBe(
      '00:00'
    );
    expect(parseEventTime(null)).toBe('00:00');
    expect(parseEventTime('invalid-date')).toBe('00:00');
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

  it('formats Z and explicit offset Timed Events using converted local calendar date (#156)', () => {
    const startUtc = '2026-11-19T01:00:00.000Z';
    const endUtc = '2026-11-19T02:30:00.000Z';

    expect(formatEventDate(startUtc, { allDay: false })).toBe(
      format(new Date(startUtc), 'dd/MM/yyyy')
    );
    expect(formatEventDateRange(startUtc, endUtc, { allDay: false })).toBe(
      `${format(new Date(startUtc), 'dd/MM/yyyy')} até ${format(new Date(endUtc), 'dd/MM/yyyy')}`
    );
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

  it('evaluates status using converted local day for night-time Timed Events (#156)', () => {
    const now = new Date();
    const todayNightStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      22,
      0,
      0
    );
    const todayNightEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      30,
      0
    );

    expect(
      getEventStatus({
        startDate: todayNightStart.toISOString(),
        endDate: todayNightEnd.toISOString(),
        allDay: false,
      })
    ).toBe('in_progress');
  });
});
