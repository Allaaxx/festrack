import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CreateEventDialog from '@/features/events/components/create-event-dialog';

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: () => ({
    role: 'OWNER',
    activeShop: { id: 'shop-1', role: 'OWNER' },
  }),
}));

vi.mock('@/features/events/hooks/use-google-calendar-sync', () => ({
  useGoogleCalendarSync: () => ({
    isSyncEnabled: false,
    isGoogleConnected: false,
  }),
}));

const mockCreateMutateAsync = vi.fn();

vi.mock('@/features/events/api/hooks', () => ({
  useGetEventTags: () => ({ data: [] }),
  useCreateEventTag: () => ({ mutateAsync: vi.fn() }),
  useDeleteEventTag: () => ({ mutate: vi.fn() }),
  useCreateEvent: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useEditEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGetEvents: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="mock-calendar" />,
}));

describe('CreateEventDialog - All-Day toggle & defaults (#155)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue({ id: 'ev-created-1' });
  });

  it('initializes with allDay: false and default times 09:00 - 10:00 when no specific time is clicked', async () => {
    render(
      <CreateEventDialog
        open={true}
        onOpenChange={vi.fn()}
        initialDate={new Date(2026, 10, 18)}
      />
    );

    const allDayCheckbox = await screen.findByRole('checkbox', {
      name: /dia inteiro/i,
    });
    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'false');

    expect(screen.getByText(/hora inicial/i)).toBeInTheDocument();
    expect(screen.getByText(/hora final/i)).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('initializes with allDay: false and clicked cell time when initialDate has specific hour/minute', async () => {
    render(
      <CreateEventDialog
        open={true}
        onOpenChange={vi.fn()}
        initialDate={new Date(2026, 10, 18, 14, 30)}
      />
    );

    const allDayCheckbox = await screen.findByRole('checkbox', {
      name: /dia inteiro/i,
    });
    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('14:30')).toBeInTheDocument();
    expect(screen.getByText('15:30')).toBeInTheDocument();
  });

  it('hides time pickers when checking "Dia inteiro" and submits allDay: true', async () => {
    const user = userEvent.setup();
    render(
      <CreateEventDialog
        open={true}
        onOpenChange={vi.fn()}
        initialDate={new Date(2026, 10, 18)}
      />
    );

    const allDayCheckbox = await screen.findByRole('checkbox', {
      name: /dia inteiro/i,
    });
    expect(screen.getByText(/hora inicial/i)).toBeInTheDocument();
    expect(screen.getByText(/hora final/i)).toBeInTheDocument();

    await user.click(allDayCheckbox);

    expect(allDayCheckbox).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText(/hora inicial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hora final/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nome do evento/i), {
      target: { value: 'Feriado Municipal' },
    });

    await user.click(screen.getByRole('button', { name: /criar evento/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Feriado Municipal',
          allDay: true,
          startDate: new Date(2026, 10, 18, 0, 0, 0),
          endDate: new Date(2026, 10, 18, 0, 0, 0),
        })
      );
    });
  });
});
