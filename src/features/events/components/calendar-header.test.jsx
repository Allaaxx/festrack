import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CalendarHeader } from '@/features/events/components/calendar-header';

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

  it('renders today button and invokes onToday when clicked', () => {
    render(<CalendarHeader {...defaultProps} />);

    const todayBtn = screen.getByRole('button', { name: /hoje/i });
    expect(todayBtn).toBeInTheDocument();
    fireEvent.click(todayBtn);
    expect(defaultProps.onToday).toHaveBeenCalledTimes(1);
  });

  it('renders navigation buttons and invokes onPrevious and onNext', () => {
    render(<CalendarHeader {...defaultProps} />);

    const prevBtn = screen.getByRole('button', { name: /anterior/i });
    const nextBtn = screen.getByRole('button', { name: /próximo/i });

    fireEvent.click(prevBtn);
    expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);

    fireEvent.click(nextBtn);
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });

  it('renders new event button and invokes onEventCreate when clicked', () => {
    render(<CalendarHeader {...defaultProps} />);

    const createBtn = screen.getByRole('button', { name: /novo evento/i });
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(defaultProps.onEventCreate).toHaveBeenCalledTimes(1);
  });

  it('does not render Google Calendar sync button in the header', () => {
    render(<CalendarHeader {...defaultProps} />);

    expect(
      screen.queryByRole('button', { name: /sincronizar com google agenda/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /sincronização google agenda ativa/i,
      })
    ).not.toBeInTheDocument();
  });
});
