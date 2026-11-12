import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRentalCheckIn } from '@/features/catalog/api/rentals';
import RentalCheckinDialog from '@/features/catalog/components/rental-checkin-dialog';

vi.mock('@/features/catalog/api/rentals', async () => {
  const actual = await vi.importActual('@/features/catalog/api/rentals');
  return {
    ...actual,
    useRentalCheckIn: vi.fn(),
  };
});

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('RentalCheckinDialog Component (#116)', () => {
  let queryClient;
  let mockMutateAsync;
  const mockOnOpenChange = vi.fn();

  const mockRental = {
    id: 'rental-1',
    customerName: 'Mariana Souza',
    eventName: 'Casamento Mariana & Thiago',
    status: 'pending_return',
    scheduledDates: '08 Nov - 12 Nov 2026',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Mesa Rústica Retangular 2m',
        quantity: 2,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Bolo Cenográfico Fake 3 Andares',
        quantity: 1,
      },
    ],
  };

  const renderDialog = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RentalCheckinDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          rental={mockRental}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockMutateAsync = vi.fn().mockResolvedValue({
      success: true,
      rentalId: 'rental-1',
      status: 'inspected',
    });

    useRentalCheckIn.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it('renders customer and event summary and all allocated items', () => {
    renderDialog();

    expect(screen.getByText('Check-in de Locação')).toBeInTheDocument();
    expect(screen.getByText(/Mariana Souza/i)).toBeInTheDocument();
    expect(screen.getByText(/Casamento Mariana & Thiago/i)).toBeInTheDocument();

    expect(screen.getByText('Mesa Rústica Retangular 2m')).toBeInTheDocument();
    expect(
      screen.getByText('Bolo Cenográfico Fake 3 Andares')
    ).toBeInTheDocument();

    // Quantities displayed
    expect(screen.getByText(/2 un/i)).toBeInTheDocument();
    expect(screen.getByText(/1 un/i)).toBeInTheDocument();
  });

  it('submits check-in with all items intact successfully', async () => {
    const user = userEvent.setup();
    renderDialog();

    const submitBtn = screen.getByRole('button', {
      name: /concluir check-in|confirmar check-in/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        rentalId: 'rental-1',
        items: [
          expect.objectContaining({
            id: 'item-1',
            productId: 'prod-1',
            returnedQuantity: 2,
            lossQuantity: 0,
          }),
          expect.objectContaining({
            id: 'item-2',
            productId: 'prod-2',
            returnedQuantity: 1,
            lossQuantity: 0,
          }),
        ],
      });
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('requires explanation note when avaria / loss > 0 and blocks submission until provided', async () => {
    const user = userEvent.setup();
    renderDialog();

    // Inputs for Mesa Rústica
    const intactInputs = screen.getAllByLabelText(/intacto/i);
    const lossInputs = screen.getAllByLabelText(/avaria|perda/i);

    // Set 1 intact, 1 loss on first item
    await user.clear(intactInputs[0]);
    await user.type(intactInputs[0], '1');

    await user.clear(lossInputs[0]);
    await user.type(lossInputs[0], '1');

    // Textarea for damage explanation should appear / be required
    const reasonTextarea = screen.getByLabelText(
      /motivo da avaria|descrição da avaria|observações da avaria/i
    );
    expect(reasonTextarea).toBeInTheDocument();

    // Attempting submit without note
    const submitBtn = screen.getByRole('button', {
      name: /concluir check-in|confirmar check-in/i,
    });
    await user.click(submitBtn);

    expect(
      screen.getByText(
        /o motivo da avaria é obrigatório|informe o motivo da avaria/i
      )
    ).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();

    // Fill note and submit
    await user.type(reasonTextarea, 'Tampo riscado gravemente na entrega');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        rentalId: 'rental-1',
        items: [
          expect.objectContaining({
            id: 'item-1',
            productId: 'prod-1',
            returnedQuantity: 1,
            lossQuantity: 1,
            lossNote: 'Tampo riscado gravemente na entrega',
          }),
          expect.objectContaining({
            id: 'item-2',
            productId: 'prod-2',
            returnedQuantity: 1,
            lossQuantity: 0,
          }),
        ],
      });
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('validates that sum of intact and loss matches original quantity', async () => {
    const user = userEvent.setup();
    renderDialog();

    const intactInputs = screen.getAllByLabelText(/intacto/i);
    const lossInputs = screen.getAllByLabelText(/avaria|perda/i);

    // Total for first item is 2. Set intact=1, loss=0 (sum = 1 != 2)
    await user.clear(intactInputs[0]);
    await user.type(intactInputs[0], '1');
    await user.clear(lossInputs[0]);
    await user.type(lossInputs[0], '0');

    const submitBtn = screen.getByRole('button', {
      name: /concluir check-in|confirmar check-in/i,
    });
    await user.click(submitBtn);

    expect(
      screen.getByText(/a soma de itens intactos e avarias deve ser igual/i)
    ).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('closes modal when clicking Cancelar button', async () => {
    const user = userEvent.setup();
    renderDialog();

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelBtn);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
