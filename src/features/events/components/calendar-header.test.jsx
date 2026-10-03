import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CalendarHeader } from '@/features/events/components/calendar-header';
import { useGoogleCalendarSync } from '@/features/events/hooks/use-google-calendar-sync';

vi.mock('@/features/events/hooks/use-google-calendar-sync', () => ({
  useGoogleCalendarSync: vi.fn(),
}));

describe('CalendarHeader Component', () => {
  const defaultProps = {
    view: 'month',
    viewTitle: 'Outubro 2026',
    viewLabels: { month: 'Mês', week: 'Semana', day: 'Dia' },
    onViewChange: vi.fn(),
    onEventCreate: vi.fn(),
    onToday: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    events: [],
    currentDate: new Date(2026, 9, 1),
    onDateChange: vi.fn(),
    sidebarDate: new Date(2026, 9, 1),
    onSidebarDateChange: vi.fn(),
    selectedStatuses: [],
    onToggleStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active Google Calendar sync indicator when synchronization is enabled', () => {
    useGoogleCalendarSync.mockReturnValue({
      isGoogleConnected: true,
      isSyncEnabled: true,
      isConnecting: false,
      toggleSync: vi.fn(),
    });

    render(<CalendarHeader {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: /sincronização google agenda ativa/i })
    ).toBeInTheDocument();
  });

  it('renders sync prompt button when Google Calendar sync is disabled', () => {
    useGoogleCalendarSync.mockReturnValue({
      isGoogleConnected: false,
      isSyncEnabled: false,
      isConnecting: false,
      toggleSync: vi.fn(),
    });

    render(<CalendarHeader {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: /sincronizar com google agenda/i })
    ).toBeInTheDocument();
  });

  it('invokes toggleSync when clicking the sync button', () => {
    const mockToggle = vi.fn();
    useGoogleCalendarSync.mockReturnValue({
      isGoogleConnected: true,
      isSyncEnabled: false,
      isConnecting: false,
      toggleSync: mockToggle,
    });

    render(<CalendarHeader {...defaultProps} />);

    const syncBtn = screen.getByRole('button', {
      name: /sincronizar com google agenda/i,
    });
    fireEvent.click(syncBtn);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
