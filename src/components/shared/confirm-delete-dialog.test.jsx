import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ConfirmDeleteDialog from '@/components/shared/confirm-delete-dialog';
import { Button } from '@/components/ui/button';

describe('ConfirmDeleteDialog', () => {
  it('renders with default labels and opens when trigger is clicked (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<ConfirmDeleteDialog trigger={<Button>Abrir modal</Button>} />);

    expect(screen.queryByText('Excluir?')).not.toBeInTheDocument();

    const triggerBtn = screen.getByRole('button', { name: /abrir modal/i });
    await user.click(triggerBtn);

    expect(
      screen.getByRole('heading', { name: 'Excluir?' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Esta ação não poderá ser desfeita.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancelar' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
  });

  it('renders open initially when defaultOpen is true in uncontrolled mode', () => {
    render(<ConfirmDeleteDialog defaultOpen={true} />);

    expect(
      screen.getByRole('heading', { name: 'Excluir?' })
    ).toBeInTheDocument();
  });

  it('renders custom title, description, confirmLabel, and cancelLabel', () => {
    render(
      <ConfirmDeleteDialog
        open={true}
        title="Remover transação?"
        description="Esta transação será permanentemente excluída."
        confirmLabel="Sim, deletar"
        cancelLabel="Não, manter"
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Remover transação?' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Esta transação será permanentemente excluída.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Não, manter' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sim, deletar' })
    ).toBeInTheDocument();
  });

  it('renders optional children content when provided', () => {
    render(
      <ConfirmDeleteDialog open={true}>
        <div data-testid="extra-content">
          Item: Aluguel de Equipamentos (R$ 500,00)
        </div>
      </ConfirmDeleteDialog>
    );

    expect(screen.getByTestId('extra-content')).toBeInTheDocument();
    expect(screen.getByText(/aluguel de equipamentos/i)).toBeInTheDocument();
  });

  it('does not render trigger when trigger is null or omitted in controlled mode', () => {
    const { rerender } = render(
      <ConfirmDeleteDialog open={false} trigger={null} />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<ConfirmDeleteDialog open={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ConfirmDeleteDialog open={true} onConfirm={onConfirm} />);

    const confirmBtn = screen.getByRole('button', { name: 'Excluir' });
    await user.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('handles cancelation and calls onCancel and onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDeleteDialog
        open={true}
        onCancel={onCancel}
        onOpenChange={onOpenChange}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when clicking the header close (X) button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<ConfirmDeleteDialog open={true} onOpenChange={onOpenChange} />);

    const closeBtn = screen.getByRole('button', { name: /close/i });
    await user.click(closeBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('dismisses when pressing Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<ConfirmDeleteDialog open={true} onOpenChange={onOpenChange} />);

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables cancel and confirm buttons and renders spinner when isPending is true', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmDeleteDialog open={true} isPending={true} onConfirm={onConfirm} />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    const confirmBtn = screen.getByRole('button', { name: /excluir/i });

    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();

    // Spinner with animate-spin should be present in confirm button
    const spinner = confirmBtn.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    // Clicking while disabled should not trigger onConfirm
    await user.click(confirmBtn);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms button has destructive variant styling', () => {
    render(<ConfirmDeleteDialog open={true} />);

    const confirmBtn = screen.getByRole('button', { name: 'Excluir' });
    expect(confirmBtn.className).toMatch(/destructive/);
  });
});
