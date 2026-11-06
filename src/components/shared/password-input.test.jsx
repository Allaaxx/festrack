import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PasswordInput from '@/components/shared/password-input';

describe('PasswordInput', () => {
  it('renders input with default right padding pr-10 so toggle button does not overlap text', () => {
    render(<PasswordInput placeholder="Digite sua senha" />);

    const input = screen.getByPlaceholderText('Digite sua senha');
    expect(input).toHaveClass('pr-10');
  });

  it('merges custom className with pr-10', () => {
    render(
      <PasswordInput placeholder="Digite sua senha" className="bg-muted" />
    );

    const input = screen.getByPlaceholderText('Digite sua senha');
    expect(input).toHaveClass('pr-10');
    expect(input).toHaveClass('bg-muted');
  });

  it('toggles password visibility when eye button is clicked', () => {
    render(<PasswordInput placeholder="Digite sua senha" />);

    const input = screen.getByPlaceholderText('Digite sua senha');
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });
});
