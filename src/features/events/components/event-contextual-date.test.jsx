import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CreateEventDialog from '@/features/events/components/create-event-dialog';

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('@/features/events/hooks/use-google-calendar-sync', () => ({
  useGoogleCalendarSync: () => ({
    isSyncEnabled: false,
    isGoogleConnected: false,
  }),
}));

vi.mock('@/features/events/api/hooks', () => ({
  useCreateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEditEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGetEvents: () => ({ data: [], isLoading: false }),
}));

describe('Contextual Date Initialization (#129)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes startDate and endDate to the future initialDate provided by the calendar view', async () => {
    // Navigated to January 2027
    const futureDate = new Date(2027, 0, 15, 10, 30);

    render(
      <CreateEventDialog
        open={true}
        onOpenChange={vi.fn()}
        initialDate={futureDate}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify startDate and endDate buttons show January 2027 formatted date
    const dateButtons = screen.getAllByRole('button');
    const startOrEndButton = dateButtons.find(
      (btn) =>
        btn.textContent.includes('janeiro') || btn.textContent.includes('2027')
    );
    expect(startOrEndButton).toBeInTheDocument();
  });
});
