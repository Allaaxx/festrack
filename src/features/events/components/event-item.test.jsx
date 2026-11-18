import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EventItem } from './event-item';

describe('EventItem - Pink Styling for Untagged & Orphan Events across all 5 views', () => {
  const baseEvent = {
    id: 'ev-1',
    title: 'Planejamento de Aniversário',
    start: new Date(2026, 10, 20, 10, 0),
    end: new Date(2026, 10, 20, 12, 0),
    allDay: false,
  };

  const tagOptions = [
    { value: 'workshop', label: 'Workshop', dotClass: 'bg-indigo-400' },
  ];

  it('renders untagged event in neutral pink in month view', () => {
    const untaggedEvent = { ...baseEvent, tag: null };
    render(<EventItem event={untaggedEvent} view="month" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-pink-200/50');
    expect(button.className).toContain('text-pink-950/80');
  });

  it('renders untagged event in neutral pink in week view', () => {
    const untaggedEvent = { ...baseEvent, tag: null };
    render(<EventItem event={untaggedEvent} view="week" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-pink-200/50');
  });

  it('renders untagged event in neutral pink in day view', () => {
    const untaggedEvent = { ...baseEvent, tag: null };
    render(<EventItem event={untaggedEvent} view="day" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-pink-200/50');
  });

  it('renders untagged event in neutral pink in agenda view', () => {
    const untaggedEvent = { ...baseEvent, tag: null };
    render(<EventItem event={untaggedEvent} view="agenda" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-pink-200/50');
  });

  it('renders orphan tag event in neutral pink', () => {
    const orphanEvent = { ...baseEvent, tag: 'deleted-tag-slug' };
    render(
      <EventItem event={orphanEvent} view="month" tagOptions={tagOptions} />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-pink-200/50');
  });

  it('renders valid tagged event with its tag color', () => {
    const taggedEvent = { ...baseEvent, tag: 'workshop' };
    render(
      <EventItem event={taggedEvent} view="month" tagOptions={tagOptions} />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-indigo-200/50');
  });
});
